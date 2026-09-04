import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  REGULATION, FUNCTIONS, CONTROLS, CATALOG_STATS, PROFILE_FLAGS,
  getControl, appliesTo, applicableControls, searchControls, validateCatalog, normalizeProfile
} from '../src/catalog.js';
import { assess, scaffold, validateAssessment, bandFor, STATUSES } from '../src/assess.js';
import { buildPlan, deadlineStatus, evidencePack, milestones, prioritize, DEPENDENCIES } from '../src/plan.js';
import { crosswalkTable, reverseIndex, mappingsFor, coverageSummary, validateCrosswalk, ISO_MAP } from '../src/crosswalk.js';
import { renderReport, renderMarkdown, renderCSV } from '../src/report.js';
import { diffAssessments } from '../src/diff.js';
import { evidenceRegister, unevidencedClaims, renderRegisterCSV, readEvidenceRecords, REFRESH_DAYS } from '../src/evidence.js';
import { forecast, buildSeries } from '../src/trend.js';
import { rollUp, renderPortfolioCSV, SYSTEMIC_SHARE } from '../src/portfolio.js';
import { MESSAGES, count } from '../src/messages.js';
import { DOCUMENTS, getDocument, renderDraft, validateDocuments, DRAFT_STATS } from '../src/drafts.js';
import { ROLES, buildChecklist, renderChecklist, validateRoles, CHECKLIST_STATS } from '../src/checklists.js';
import { buildSite, buildPayload } from '../scripts/build-site.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = resolve(root, 'bin/nbcc.js');
const EXAMPLE = resolve(root, 'templates/example-assessment.json');

function cli(args) {
  return execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
}

/* ------------------------------------------------------------------ catalog */

test('catalog is internally consistent', () => {
  assert.deepEqual(validateCatalog(), []);
});

test('catalog carries every control named in the Annex', () => {
  const expected = [
    'GOV-1','GOV-2','GOV-3','GOV-4','GOV-5','GOV-6',
    'ID-1','ID-2','ID-3',
    'PR-1','PR-1.1','PR-1.2','PR-2','PR-2.1','PR-2.2','PR-3','PR-3.1','PR-4','PR-4.1','PR-4.2','PR-5','PR-6',
    'DE-1','DE-2','RS-1','RS-2','RC-1','RC-2',
    'CLD-1','CLD-2','CLD-3','CLD-4','CLD-5','CLD-6','CLD-7','CLD-8',
    'CLD-9','CLD-10','CLD-11','CLD-12','CLD-13','CLD-14','CLD-15','CLD-16'
  ];
  assert.deepEqual(CONTROLS.map((c) => c.id), expected);
  assert.equal(CONTROLS.length, 44);
});

test('the regulation dates match the gazette and Article 7', () => {
  assert.equal(REGULATION.publishedOn, '2026-04-05');
  assert.equal(REGULATION.complianceWindowMonths, 18);
  assert.equal(REGULATION.deadline, '2027-10-05');
  const d = new Date(REGULATION.publishedOn + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + REGULATION.complianceWindowMonths);
  assert.equal(d.toISOString().slice(0, 10), REGULATION.deadline);
});

test('every control quotes an official requirement and decomposes it', () => {
  for (const c of CONTROLS) {
    assert.ok(c.requirement.length > 60, `${c.id} requirement looks truncated`);
    assert.ok(c.checks.length >= 3, `${c.id} has too few checks`);
    assert.ok(c.evidence.length >= 3, `${c.id} has too few evidence items`);
    for (const k of c.checks) {
      assert.ok(k.endsWith('.'), `${c.id} check is not a full statement: ${k}`);
    }
  }
});

test('control ids are unique and resolvable case insensitively', () => {
  assert.equal(new Set(CONTROLS.map((c) => c.id)).size, CONTROLS.length);
  assert.equal(getControl('gov-1').id, 'GOV-1');
  assert.equal(getControl(' pr-1.1 ').id, 'PR-1.1');
  assert.equal(getControl('NOPE'), undefined);
  assert.equal(getControl(null), undefined);
});

test('search finds controls by requirement text', () => {
  const mfa = searchControls('MFA').map((c) => c.id);
  assert.ok(mfa.includes('PR-2'));
  assert.ok(mfa.includes('CLD-9'));
  assert.ok(searchControls('SPF').map((c) => c.id).includes('PR-4'));
  assert.deepEqual(searchControls(''), []);
});

test('catalog statistics stay in step with the data', () => {
  assert.equal(CATALOG_STATS.controls, CONTROLS.length);
  assert.equal(CATALOG_STATS.checks, CONTROLS.reduce((n, c) => n + c.checks.length, 0));
  assert.equal(CATALOG_STATS.functions, FUNCTIONS.length);
});

test('official titles keep the ampersand the gazette prints', () => {
  // These were silently normalised to "and" in an earlier pass, which made the
  // catalog quietly disagree with the instrument it claims to reproduce.
  const expected = {
    'GOV-1': 'Governance & Roles',
    'GOV-5': 'Periodic Self-Assessment & Continuous Improvement',
    'PR-1': 'Secure Configuration, Hardening & Network Segmentation',
    'PR-3': 'Awareness & Human Factors',
    'CLD-3': 'Right to Audit (Third-Party Assurance)',
    'CLD-12': 'Data Residency (Customer Content)'
  };
  for (const [id, title] of Object.entries(expected)) {
    assert.equal(getControl(id).title, title);
  }
  const ampersands = CONTROLS.filter((c) => c.title.includes('&')).length;
  assert.equal(ampersands, 24, 'the Annex prints 24 titles containing an ampersand');
});

test('bulleted requirements keep the structure the Annex gives them', () => {
  const bulleted = CONTROLS.filter((c) => c.requirement.includes('\u2022')).map((c) => c.id);
  assert.deepEqual(bulleted, ['GOV-6', 'PR-1.1', 'PR-6', 'DE-1']);
  const pr6 = getControl('PR-6').requirement.split('\n');
  assert.equal(pr6.filter((l) => l.startsWith('\u2022')).length, 3);
  assert.ok(pr6[0].endsWith('including at least:'), 'the lead in must introduce the list');
  for (const id of bulleted) {
    for (const line of getControl(id).requirement.split('\n')) {
      assert.ok(line.trim().length > 0, `${id} requirement has a blank line`);
      assert.ok(!line.startsWith(' '), `${id} requirement line is indented`);
    }
  }
});

test('every purpose declares whether the Annex actually prints one', () => {
  // Appendix A tables carry only Control ID, Control Title and Minimum
  // Requirement, so a cloud purpose is this project's summary, not the text.
  for (const c of CONTROLS) {
    assert.ok(['annex', 'editorial'].includes(c.purposeSource), `${c.id} has no purposeSource`);
  }
  const editorial = CONTROLS.filter((c) => c.purposeSource === 'editorial').map((c) => c.id);
  assert.equal(editorial.length, 16);
  assert.ok(editorial.every((id) => id.startsWith('CLD-')));
  assert.ok(CONTROLS.filter((c) => c.fn !== 'CLD').every((c) => c.purposeSource === 'annex'));
});

test('an editorial purpose is marked wherever it is displayed', () => {
  const doc = scaffold();
  const html = renderReport(doc);
  assert.ok(html.includes('not Annex text'), 'the report must disclaim editorial purposes');
  const site = buildSite();
  assert.ok(site.includes('edmark'), 'the site must carry the editorial marker');
  assert.ok(site.includes('purposeSource'), 'the payload must carry provenance');
  const out = execFileSync(process.execPath, [CLI, 'show', 'CLD-1'], { encoding: 'utf8' });
  assert.ok(out.includes('not Annex text'), 'the CLI must disclaim editorial purposes');
});

test('the report renders bullets as a list rather than running prose', () => {
  const html = renderReport(scaffold());
  assert.ok(html.includes('<ul class="reqlist">'));
  assert.ok(html.includes('<li>Doors or cabinets that can be locked when the area is unattended.</li>'));
  assert.ok(!html.includes('\u2022'), 'raw bullet characters should not reach the report');
});

test('no user facing Arabic is written inline in the command line tool', () => {
  // The message table exists so a command cannot half switch language. Two
  // commands were still carrying their own inline ternaries long after the
  // table landed, which is how "2 ضابطا" survived the numeral agreement pass.
  const cli = readFileSync(resolve(root, 'bin/nbcc.js'), 'utf8');
  const stray = cli.split('\n')
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => /[\u0600-\u06FF]/.test(line));
  assert.deepEqual(stray.map(([n, l]) => `${n}: ${l.trim().slice(0, 70)}`), [],
    'Arabic belongs in src/messages.js, not in a command body');
});

test('no user facing Arabic is written inline in the workbench either', () => {
  // The equivalent test for the command line has been in place since v0.11.4.
  // The workbench went unchecked, and the crosswalk header and its search
  // field were still carrying their own literals.
  const site = readFileSync(resolve(root, 'site/app.html'), 'utf8');
  // The About panel is a paired long form block, which is the same pattern as
  // the string table. The fault worth failing on is a conditional literal
  // scattered through render code, because that is what half switches.
  const stray = site.split('\n')
    .filter((line) => /lang\s*===?\s*'ar'\s*\?/.test(line) && ARABIC.test(line))
    // The language toggle names the language it switches to, so it cannot come
    // from the table of the language currently in use.
    .filter((line) => !line.includes("getElementById('lang')"));
  assert.deepEqual(stray.map((l) => l.trim().slice(0, 70)), [],
    'a language ternary with an Arabic literal belongs in the STR table');
});

test('the crosswalk is readable on a phone rather than scrolled sideways', () => {
  // Five columns of framework references cannot be read on a 390 pixel screen,
  // so each row stacks into a labelled record instead.
  const site = buildSite();
  assert.ok(site.includes('data-l="'), 'each cell must carry its own label for the stacked view');
  assert.ok(site.includes("#cwTable td::before{content:attr(data-l)"),
    'the stacked view must print the column label beside the value');
  assert.ok(site.includes('#cwTable thead{position:absolute'),
    'the header row must be hidden from sight but left for a screen reader');
});

test('Arabic counts agree with the noun they count', () => {
  // One takes the singular, two the dual, three to ten a plural, and eleven
  // upward a singular accusative. A template that always writes يوما is wrong
  // for every count below eleven.
  const cases = [
    [1, 'day', 'يوم واحد'], [2, 'day', 'يومان'], [3, 'day', '3 أيام'],
    [10, 'day', '10 أيام'], [11, 'day', '11 يوما'], [397, 'day', '397 يوما'],
    [1, 'control', 'ضابط واحد'], [2, 'control', 'ضابطان'], [7, 'control', '7 ضوابط'],
    [44, 'control', '44 ضابطا'], [3, 'year', '3 سنوات'], [2, 'entity', 'جهتان']
  ];
  for (const [n, kind, want] of cases) {
    assert.equal(count(n, kind), want, `count(${n}, ${kind})`);
  }
  // And the deadline line has to use it rather than a bare template.
  assert.equal(MESSAGES.ar.deadlineRemain(1, '2027-10-05'),
    'بقي يوم واحد على استحقاق الامتثال الكامل في 2027-10-05.');
  assert.equal(MESSAGES.ar.deadlineRemain(4, '2027-10-05'),
    'بقي 4 أيام على استحقاق الامتثال الكامل في 2027-10-05.');
});

test('the Arabic interface carries no calqued English idioms', () => {
  // Each of these was a phrase translated word for word out of the English and
  // does not read as Arabic. They are named so they cannot come back.
  const site = buildSite();
  const report = renderReport(JSON.parse(readFileSync(EXAMPLE, 'utf8')), { today: SEP, lang: 'ar' });
  const cli = readFileSync(resolve(root, 'src/messages.js'), 'utf8');
  const surfaces = [site, report, cli].join('\n');
  const calques = {
    'أين تقف الجهة': 'Where the entity stands, translated literally',
    'موقع الجهة اليوم': 'موقع reads as a physical location',
    'قريب لكنه قاصر': 'close but short, translated literally',
    'الأسوأ توقعا': 'worst projection, should be الأدنى توقعا',
    'تتوقع الأدلة': 'makes the evidence the thing doing the projecting',
    'لا ضابط يخفق لدى معظم المحفظة': 'a portfolio is not the thing that fails',
    'يوما تبقى قبل أن يكون كل ضابط قائما': 'a control is مطبق, not قائم',
    'مسح هذا الضابط': 'مسح is ambiguous between survey and erase',
    'تعيين كل البنود': 'تعيين is appointing somebody to a post'
  };
  for (const [phrase, why] of Object.entries(calques)) {
    assert.ok(!surfaces.includes(phrase), `${why}: found "${phrase}"`);
  }
  // And the corrected forms have to actually be present.
  assert.ok(report.includes('الوضع الحالي للجهة'));
  assert.ok(cli.includes('يسير على المسار'));
  assert.ok(cli.includes('ثغرات مشتركة'));
});

test('Arabic checks lead with the verb rather than the English word order', () => {
  // Arabic is verb first. Writing "الحصر يشمل الخوادم" carries the English
  // order across and reads as translated text to an assessor.
  const VERBS = new Set(`يغطي تراجع يحمل تستخدم تحفظ تبين تحجب تحمل تزامن يشمل تسجل
    تطبق تتطلب تقفل تحدث تعطل يعمل تمنع تتبع تختبر تجمع تقدم تشارك يستخدم تغذي تدار
    تترك تتخذ توثق يتابع تعالج تعطى تحظى تتصاعد تجدد تخضع يبين`.split(/\s+/));
  const offenders = [];
  for (const c of CONTROLS) {
    for (const k of c.checksAr) {
      const w = k.replace(/\.$/, '').split(' ');
      const opensWithNoun = w[0].startsWith('ال') || w[0] === 'كل';
      if (!opensWithNoun) continue;
      for (let i = 1; i < Math.min(w.length, 7); i += 1) {
        if (VERBS.has(w[i])) { offenders.push(`${c.id}: ${k}`); break; }
      }
    }
  }
  assert.deepEqual(offenders, [], `these read as translated English:\n${offenders.join('\n')}`);
});

test('a translated template never drops a value the English shows', () => {
  // A template is a function, so a translation can quietly lose an argument
  // and the number it carried simply stops appearing. Nothing else catches it.
  const values = [11, 13, 17, 19, 23, 29, 31];
  for (const key of Object.keys(MESSAGES.en)) {
    const en = MESSAGES.en[key];
    const ar = MESSAGES.ar[key];
    if (typeof en !== 'function') {
      assert.notEqual(typeof ar, 'function', `${key} is a function in Arabic only`);
      continue;
    }
    assert.equal(typeof ar, 'function', `${key} is a function in English only`);
    assert.equal(en.length, ar.length, `${key} takes ${en.length} arguments in English, ${ar.length} in Arabic`);
    const args = values.slice(0, en.length);
    const e = String(en(...args));
    const a = String(ar(...args));
    assert.ok(!a.includes('undefined'), `${key} prints undefined in Arabic`);
    assert.ok(!e.includes('undefined'), `${key} prints undefined in English`);
    for (const v of args) {
      if (e.includes(String(v))) {
        assert.ok(a.includes(String(v)), `${key} drops the value ${v} in Arabic`);
      }
    }
  }
});

test('the Arabic says what the English says', () => {
  // Style was corrected three times over. This checks meaning: a qualifier
  // dropped from a check changes the control, however well the sentence reads.
  const QUALIFIERS = [
    [/\bat least\b/i, /على الأقل|كحد أدنى|بحد أدنى/, 'at least'],
    [/\bannually\b|\byearly\b/i, /سنويا|كل سنة/, 'annually'],
    [/\bquarterly\b/i, /ربع سنوي|كل ثلاثة أشهر/, 'quarterly'],
    [/\bmonthly\b/i, /شهريا|كل شهر/, 'monthly'],
    [/\bweekly\b/i, /أسبوعيا|كل أسبوع/, 'weekly'],
    [/where feasible|where supported|where possible|wherever possible|where practical/i,
      /متى أمكن|حيثما|متى كان ذلك عمليا/, 'where feasible'],
    [/\bunless\b/i, /ما لم|إلا/, 'unless'],
    [/\bonly\b/i, /فقط|وحده|وحدها|إلا |يقتصر|تقتصر|مقصور|تقصر/, 'only']
  ];
  const SPELLED = { 2: 'دقيقتين', 3: 'ثلاث', 8: 'ثمانية', 12: 'اثني عشر',
    14: 'أربعة عشر', 15: 'خمس عشرة', 90: 'تسعين' };

  const problems = [];
  for (const c of CONTROLS) {
    c.checks.forEach((en, i) => {
      const ar = c.checksAr[i];
      for (const d of en.match(/\b\d+\b/g) || []) {
        const n = Number(d);
        if (!ar.includes(d) && !(SPELLED[n] && ar.includes(SPELLED[n]))) {
          problems.push(`${c.id} check ${i + 1}: the number ${n} is missing`);
        }
      }
      for (const [enRe, arRe, name] of QUALIFIERS) {
        if (enRe.test(en) && !arRe.test(ar)) {
          problems.push(`${c.id} check ${i + 1}: "${name}" is dropped`);
        }
      }
    });
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('one concept is not rendered two ways', () => {
  // Removable media had two renderings across the catalog for several
  // releases, which is the kind of thing a reader notices before a test does.
  const all = CONTROLS.flatMap((c) => [c.titleAr, c.purposeAr, c.requirementAr,
    ...c.checksAr, ...c.evidenceAr]).join(' ');
  const pairs = [
    ['وسائط التخزين الخارجية', 'الوسائط المحمولة'],
    ['الإتاحة', 'التوافرية'],
    ['المسح الأمني', 'التحري'],
    ['لوحة الإدارة', 'وحدة الإدارة'],
    ['توطين', 'موطن'],
    ['حصر', 'جرد']
  ];
  for (const [preferred, rejected] of pairs) {
    const usesBoth = all.includes(preferred) && all.includes(rejected);
    assert.ok(!usesBoth, `both "${preferred}" and "${rejected}" appear; pick one`);
  }
});

test('a negation particle stays with its verb', () => {
  // Moving the verb forward and leaving لا behind reverses the meaning.
  for (const c of CONTROLS) {
    for (const k of c.checksAr) {
      assert.ok(!/ لا (تستخدم|تترك|تدار|توثق|تحفظ) /.test(k),
        `${c.id} strands a negation: ${k}`);
    }
  }
});

test('Arabic terminology follows the regional regulators, not a literal gloss', () => {
  // Each of these was wrong on first writing and was corrected against the
  // wording the Gulf cybersecurity controls actually print.
  const expected = {
    'GOV-3': 'تصنيف البيانات وسيادتها',
    'GOV-4': 'التكويت والمسح الأمني للأدوار السيبرانية',
    'PR-4.2': 'التحكم في وسائط التخزين الخارجية',
    'CLD-11': 'التشفير الافتراضي',
    'CLD-12': 'توطين البيانات (محتوى العميل)'
  };
  for (const [id, title] of Object.entries(expected)) {
    assert.equal(getControl(id).titleAr, title);
  }

  const all = CONTROLS.flatMap((c) => [c.titleAr, c.purposeAr, c.requirementAr,
    ...c.checksAr, ...c.evidenceAr]).join(' ');
  const banned = {
    'موطن': 'data residency is توطين البيانات, not موطن',
    'التحري': 'screening is المسح الأمني',
    'الوسائط المحمولة': 'removable media is وسائط التخزين الخارجية',
    'وحدة الإدارة': 'a console is لوحة تحكم, not وحدة تحكم',
    'التشفير التلقائي': 'encryption by default is التشفير الافتراضي, not التلقائي'
  };
  for (const [term, why] of Object.entries(banned)) {
    assert.ok(!all.includes(term), `${why}: found "${term}"`);
  }
});

test('the Arabic title follows the corrected English one', () => {
  // These renderings were drafted against titles that turned out to be wrong,
  // so they have to move whenever the official wording is corrected.
  assert.ok(getControl('PR-1').titleAr.includes('تجزئة الشبكة'),
    'PR-1 covers network segmentation and the Arabic must say so');
  assert.ok(!getControl('PR-3').titleAr.includes('التدريب'),
    'PR-3 is Awareness & Human Factors, not awareness and training');
  assert.ok(getControl('CLD-3').titleAr.includes('('), 'CLD-3 keeps its parenthetical');
  assert.ok(getControl('CLD-12').titleAr.includes('('), 'CLD-12 keeps its parenthetical');
  for (const c of CONTROLS) {
    assert.ok(c.titleAr && c.titleAr.trim().length > 2, `${c.id} has no Arabic title`);
    assert.ok(/[\u0600-\u06FF]/.test(c.titleAr), `${c.id} Arabic title has no Arabic script`);
  }
});

test('every check and evidence item has an Arabic counterpart', () => {
  let checks = 0, evidence = 0;
  for (const c of CONTROLS) {
    assert.equal(c.checksAr.length, c.checks.length, `${c.id} Arabic checks are out of step`);
    assert.equal(c.evidenceAr.length, c.evidence.length, `${c.id} Arabic evidence is out of step`);
    for (const line of [...c.checksAr, ...c.evidenceAr]) {
      assert.ok(/[\u0600-\u06FF]/.test(line), `${c.id} has a line with no Arabic script: ${line}`);
      assert.ok(!/[a-z]{4,}/.test(line.replace(/TLS|OIDC|SOC|CSA|STAR|DKIM|DMARC|SPF|IaaS|PaaS|SaaS/g, '')),
        `${c.id} has untranslated English: ${line}`);
    }
    checks += c.checksAr.length;
    evidence += c.evidenceAr.length;
  }
  assert.equal(checks, CATALOG_STATS.checks);
  assert.equal(evidence, CATALOG_STATS.evidenceItems);
});

test('Arabic checks end in a full stop like the English ones', () => {
  for (const c of CONTROLS) {
    for (const k of c.checksAr) {
      assert.ok(k.endsWith('.'), `${c.id} Arabic check is not a full statement: ${k}`);
    }
    for (const e of c.evidenceAr) {
      assert.ok(!e.endsWith('.'), `${c.id} Arabic evidence should be a noun phrase: ${e}`);
    }
  }
});

test('the catalog validator rejects Arabic that falls out of step', () => {
  // Guard the guard: the validation has to actually fire, not just pass.
  const good = CONTROLS[0];
  assert.equal(good.checksAr.length, good.checks.length);
  assert.ok(validateCatalog().length === 0);
});

test('the site payload carries the Arabic decomposition', () => {
  const p = buildPayload();
  assert.equal(p.controls.reduce((n, c) => n + c.checksAr.length, 0), CATALOG_STATS.checks);
  assert.equal(p.controls.reduce((n, c) => n + c.evidenceAr.length, 0), CATALOG_STATS.evidenceItems);
  const site = buildSite();
  assert.ok(site.includes('checksAr'), 'the shipped page must carry the Arabic checks');
  assert.ok(site.includes('المناطق التقنية الحرجة محددة'), 'a known Arabic check should be present');
});

test('every control carries a working Arabic requirement', () => {
  for (const c of CONTROLS) {
    assert.ok(c.requirementAr && c.requirementAr.trim(), `${c.id} has no requirementAr`);
    assert.ok(/[\u0600-\u06FF]/.test(c.requirementAr), `${c.id} requirementAr has no Arabic script`);
    // The English is authoritative and must never be replaced by the Arabic.
    assert.ok(c.requirement && c.requirement.trim(), `${c.id} lost its official requirement`);
    assert.notEqual(c.requirementAr, c.requirement);
  }
});

test('the Arabic requirement keeps the bullet structure of the official text', () => {
  for (const c of CONTROLS) {
    const en = (c.requirement.match(/\u2022/g) || []).length;
    const ar = (c.requirementAr.match(/\u2022/g) || []).length;
    assert.equal(ar, en, `${c.id} has ${ar} Arabic bullets against ${en} official ones`);
  }
});

test('neither language table has a key the other is missing', () => {
  // A missing key falls back to the other language, which is how English
  // labels ended up inside the Arabic interface without anyone noticing.
  const html = buildSite();
  const body = html.match(/const STR = \{([\s\S]*?)\n\};/)[1];
  const en = body.slice(body.indexOf('en:'), body.indexOf('ar:'));
  const ar = body.slice(body.indexOf('ar:'));
  const keys = (t) => new Set(
    [...t.matchAll(/(?:^|[\s{,])([a-zA-Z][a-zA-Z0-9]*)\s*:/g)].map((x) => x[1])
  );
  const ek = keys(en);
  const ak = keys(ar);
  const missingAr = [...ek].filter((k) => !ak.has(k) && k !== 'en');
  const missingEn = [...ak].filter((k) => !ek.has(k) && k !== 'ar');
  assert.deepEqual(missingAr, [], `Arabic is missing: ${missingAr.join(', ')}`);
  assert.deepEqual(missingEn, [], `English is missing: ${missingEn.join(', ')}`);
});

test('the shipped page carries both requirement languages', () => {
  const site = buildSite();
  assert.ok(site.includes('requirementAr'));
  assert.ok(site.includes('تنشئ الجهة حصرا لمزودي الخدمة'), 'a known Arabic requirement should ship');
  assert.ok(site.includes('showOfficial'), 'the official text must remain reachable');
});

test('the compliance measure draws inside its own canvas in both languages', () => {
  // text-anchor resolves against the inherited direction, so an end anchored
  // label was drawn outside the viewBox once the page went right to left and
  // the last milestone simply vanished.
  for (const lang of ['en', 'ar']) {
    const html = renderReport(scaffold(), { today: SEP, lang });
    const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>'));
    assert.ok(svg.includes('direction="ltr"'),
      'the measure has to be pinned to ltr or its labels flip out of frame');
    // The end labels must anchor inward now that the track runs edge to edge.
    assert.ok(svg.includes('text-anchor="end"'), `${lang} has no end anchored label`);
    assert.ok(svg.includes('text-anchor="middle"'), `${lang} has no middle anchored label`);
    for (const m of svg.matchAll(/<text x="([\d.]+)"/g)) {
      assert.ok(Number(m[1]) <= 900, `a label sits past the right edge at x=${m[1]}`);
      assert.ok(Number(m[1]) >= 0, `a label sits past the left edge at x=${m[1]}`);
    }
  }
});

test('the hero tally cells cannot push into each other', () => {
  // As flex items without a minimum width, a long label grew its own cell and
  // printed on the same line as the next one.
  const css = buildSite();
  assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),
    'the tally must be a grid with shrinkable columns');
  assert.ok(css.includes('.tally div{min-width:0'),
    'a tally cell must be allowed to shrink below its content');
});

/* ------------------------------------------------------- accessibility */

test('the shipped page carries the landmarks and links its tabs to its panels', () => {
  const html = buildSite();
  for (const tag of ['<header', '<main', '<footer', 'role="tablist"']) {
    assert.ok(html.includes(tag), `the page is missing ${tag}`);
  }
  // A tab that does not name its panel leaves a screen reader user guessing.
  const tabs = [...html.matchAll(/role="tab"\s+id="tab-(\w+)"\s+aria-controls="panel-(\w+)"/g)];
  assert.equal(tabs.length, 6, 'every tab should declare the panel it controls');
  for (const [, id, controls] of tabs) {
    assert.equal(id, controls);
    assert.ok(html.includes(`id="panel-${controls}" role="tabpanel" aria-labelledby="tab-${controls}"`),
      `panel ${controls} does not point back at its tab`);
  }
  assert.equal((html.match(/<h1/g) || []).length, 1, 'exactly one h1');
  assert.ok(html.includes('aria-live="polite"'), 'score changes need to be announced');
});

test('a person who asks for reduced motion gets it', () => {
  assert.ok(buildSite().includes('prefers-reduced-motion'),
    'the page must honour the reduced motion preference');
});

test('the skip link is reachable rather than parked off screen', () => {
  const html = buildSite();
  // Parking it at a negative inline offset broke right to left layout once, so
  // it moves vertically and must stay the first thing in the document.
  assert.ok(html.includes('class="skip"'));
  assert.ok(!/\.skip\{[^}]*left:\s*-/.test(html), 'the skip link must not sit at a negative offset');
  assert.ok(/\.skip:focus\{[^}]*top:/.test(html), 'focusing the skip link must bring it on screen');
});

test('text colours meet the contrast the interface promises', () => {
  // These were measured against the paper background in a browser. The
  // secondary slate and the ochre both had to darken to clear 4.5 to 1.
  const html = buildSite();
  const tok = (name) => (html.match(new RegExp(`--${name}\\s*:\\s*(#[0-9A-Fa-f]{6})`)) || [])[1];
  const lum = (hex) => {
    const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const paper = tok('paper');
  for (const name of ['slate', 'slate-2', 'ochre', 'crimson', 'green', 'ink']) {
    const c = tok(name);
    assert.ok(c, `token --${name} is missing`);
    assert.ok(ratio(c, paper) >= 4.5,
      `--${name} (${c}) is ${ratio(c, paper).toFixed(2)} to 1 on paper, below 4.5`);
  }
});

test('a check that goes past the Annex is marked as such', () => {
  // The decomposition is this project's work, but a check that demands more
  // than the requirement states has to be distinguishable from one that
  // restates it, or the tool quietly widens the regulation.
  const marked = CONTROLS.filter((c) => c.beyondAnnex && c.beyondAnnex.length);
  assert.equal(marked.length, 9);
  assert.equal(CATALOG_STATS.checksBeyondAnnex, 9);
  for (const c of marked) {
    for (const i of c.beyondAnnex) {
      assert.ok(Number.isInteger(i) && i >= 0 && i < c.checks.length,
        `${c.id} marks a check index that does not exist`);
    }
  }
  // Known cases, so a future edit cannot quietly drop the marker.
  assert.ok(getControl('CLD-6').beyondAnnex.includes(2),
    'measuring achieved availability is not stated in CLD-6');
  assert.ok(getControl('GOV-1').beyondAnnex.includes(1),
    'a signed appointment is an evidentiary standard GOV-1 does not state');
});

test('the marker reaches every surface that shows a check', () => {
  const site = buildSite();
  assert.ok(site.includes('beyondAnnex'), 'the payload must carry the flag');
  assert.ok(site.includes('beyondMark'), 'the workbench must render it');
  const report = renderReport(JSON.parse(readFileSync(EXAMPLE, 'utf8')), { today: SEP });
  assert.equal((report.match(/beyond the Annex/g) || []).length, 9);
  const shown = execFileSync(process.execPath, [CLI, 'show', 'CLD-6'], { encoding: 'utf8' });
  assert.ok(shown.includes('beyond the Annex'));
  assert.ok(shown.includes('The Annex does not state them'));
  const ar = execFileSync(process.execPath, [CLI, 'show', 'CLD-6', '--ar'], { encoding: 'utf8' });
  assert.ok(ar.includes('زائد على الملحق'));
});

/* -------------------------------------------------------------- scoping */

test('cloud controls drop out when the entity uses no cloud', () => {
  const withCloud = applicableControls({ usesCloud: true, hasPublicAccounts: true });
  const without = applicableControls({ usesCloud: false, hasPublicAccounts: true });
  assert.equal(withCloud.length, 44);
  assert.equal(without.length, 28);
  assert.ok(!without.some((c) => c.fn === 'CLD'));
  assert.ok(without.some((c) => c.id === 'PR-3.1'));
});

test('an unset profile flag defaults to in scope', () => {
  const p = normalizeProfile({});
  for (const f of PROFILE_FLAGS) assert.equal(p[f.key], true);
  assert.ok(appliesTo(getControl('CLD-1'), {}));
  assert.ok(!appliesTo(getControl('CLD-1'), { usesCloud: false }));
});

/* -------------------------------------------------------------- scoring */

function build(overrides = {}) {
  const doc = scaffold({ profile: { usesCloud: true, hasPublicAccounts: true } });
  doc.assessmentDate = '2026-09-01';
  doc.entity = { name: 'Test entity' };
  for (const [id, patch] of Object.entries(overrides)) Object.assign(doc.controls[id], patch);
  return doc;
}
function allChecks(id, status) {
  return { checks: new Array(getControl(id).checks.length).fill(status), owner: 'Owner' };
}

test('a blank assessment scores zero and is fully unassessed', () => {
  const r = assess(build());
  assert.equal(r.scores.implementation, 0);
  assert.equal(r.scores.coverage, 0);
  assert.equal(r.scores.controlsUnassessed, 44);
  assert.equal(r.scores.band.key, 'initial');
});

test('a fully met assessment reaches the baseline band', () => {
  const doc = scaffold();
  for (const c of CONTROLS) Object.assign(doc.controls[c.id], allChecks(c.id, 'met'));
  const r = assess(doc);
  assert.equal(r.scores.implementation, 100);
  assert.equal(r.scores.posture, 100);
  assert.equal(r.scores.controlsMet, 44);
  assert.equal(r.scores.band.key, 'baseline');
  assert.equal(r.findings.length, 0);
});

test('a partial check is worth half of a met check', () => {
  const id = 'DE-2';
  const n = getControl(id).checks.length;
  const half = assess(build({ [id]: { checks: new Array(n).fill('partial'), owner: 'x' } }));
  const row = half.controls.find((c) => c.id === id);
  assert.equal(row.implementation, 50);
  assert.equal(row.state, 'partial');
});

test('a valid exception shelters posture but never implementation', () => {
  const doc = build({
    'PR-4.2': {
      ...allChecks('PR-4.2', 'exception'),
      exception: { reason: 'Air gapped transfer in the laboratory.', riskAccepted: true, expiry: '2027-06-30' }
    }
  });
  const row = assess(doc).controls.find((c) => c.id === 'PR-4.2');
  assert.equal(row.state, 'covered-by-exception');
  assert.equal(row.implementation, 0);
  assert.equal(row.posture, 100);
});

test('an expired exception falls back to a gap and raises a high finding', () => {
  const doc = build({
    'GOV-4': {
      ...allChecks('GOV-4', 'exception'),
      exception: { reason: 'Contract under renewal.', riskAccepted: true, expiry: '2026-06-30' }
    }
  });
  const r = assess(doc);
  const row = r.controls.find((c) => c.id === 'GOV-4');
  assert.equal(row.state, 'gap');
  assert.equal(row.posture, 0);
  const f = r.findings.find((x) => x.control === 'GOV-4' && x.issue.includes('expired'));
  assert.ok(f, 'expected an expired exception finding');
  assert.equal(f.severity, 'high');
});

test('an exception without recorded risk acceptance does not shelter anything', () => {
  const doc = build({
    'CLD-6': { ...allChecks('CLD-6', 'exception'), exception: { reason: 'Legal review.', expiry: '2027-01-31' } }
  });
  const r = assess(doc);
  assert.equal(r.controls.find((c) => c.id === 'CLD-6').state, 'gap');
  assert.ok(r.findings.some((f) => f.control === 'CLD-6' && f.issue.includes('risk acceptance')));
});

test('an exception nearing expiry is surfaced before it lapses', () => {
  const doc = build({
    'PR-6': {
      ...allChecks('PR-6', 'exception'),
      exception: { reason: 'Site works.', riskAccepted: true, expiry: '2026-10-15' }
    }
  });
  const f = assess(doc).findings.find((x) => x.control === 'PR-6' && x.issue.includes('expires in'));
  assert.ok(f, 'expected an expiry warning within 90 days');
});

test('not applicable checks leave the denominator and demand a justification', () => {
  const bare = assess(build({ 'PR-3.1': allChecks('PR-3.1', 'na') }));
  const row = bare.controls.find((c) => c.id === 'PR-3.1');
  assert.equal(row.state, 'not-applicable');
  assert.equal(row.scoredChecks, 0);
  assert.ok(bare.findings.some((f) => f.control === 'PR-3.1' && f.issue.includes('without a written justification')));

  const justified = assess(build({
    'PR-3.1': { ...allChecks('PR-3.1', 'na'), na: { justification: 'The entity runs no external accounts.' } }
  }));
  assert.ok(!justified.findings.some((f) => f.control === 'PR-3.1' && f.issue.includes('justification')));
});

test('out of scope controls are excluded from the score entirely', () => {
  const doc = scaffold({ profile: { usesCloud: false, hasPublicAccounts: true } });
  for (const c of applicableControls({ usesCloud: false, hasPublicAccounts: true })) {
    Object.assign(doc.controls[c.id], allChecks(c.id, 'met'));
  }
  const r = assess(doc);
  assert.equal(r.scores.implementation, 100);
  assert.equal(r.scores.controlsInScope, 28);
  assert.equal(r.scores.controlsOutOfScope, 16);
  assert.ok(r.controls.find((c) => c.id === 'CLD-1').state === 'out-of-scope');
});

test('a control level status fills in checks that were never answered', () => {
  const r = assess(build({ 'RC-2': { status: 'met', owner: 'x' } }));
  assert.equal(r.controls.find((c) => c.id === 'RC-2').implementation, 100);
  const f = r.findings.find((x) => x.control === 'RC-2' && x.issue.includes('control level status'));
  assert.ok(f, 'a sweeping claim should be recorded as unevidenced');
  assert.equal(f.severity, 'low');
});

test('a control level status never overrides a check that was answered', () => {
  const n = getControl('RC-2').checks.length;
  const checks = new Array(n).fill('unknown');
  checks[0] = 'gap';
  const r = assess(build({ 'RC-2': { status: 'met', checks, owner: 'x' } }));
  const row = r.controls.find((c) => c.id === 'RC-2');
  assert.equal(row.statuses[0], 'gap');
  assert.equal(row.implementation, Math.round(((n - 1) / n) * 1000) / 10);
});

test('loose status words are accepted from hand edited files', () => {
  const n = getControl('DE-2').checks.length;
  const r = assess(build({ 'DE-2': { checks: new Array(n).fill('yes'), owner: 'x' } }));
  assert.equal(r.controls.find((c) => c.id === 'DE-2').implementation, 100);
});

test('bands cover the whole range without a gap', () => {
  assert.equal(bandFor(0).key, 'initial');
  assert.equal(bandFor(24.9).key, 'initial');
  assert.equal(bandFor(25).key, 'developing');
  assert.equal(bandFor(74.9).key, 'progressing');
  assert.equal(bandFor(95).key, 'baseline');
  assert.equal(bandFor(100).key, 'baseline');
  assert.equal(bandFor(-5).key, 'initial');
  assert.equal(bandFor(999).key, 'baseline');
});

test('every status in the model is handled by the scorer', () => {
  for (const s of STATUSES) {
    const r = assess(build({ 'DE-2': allChecks('DE-2', s) }));
    assert.ok(r.controls.find((c) => c.id === 'DE-2').state, `status ${s} produced no state`);
  }
});

/* --------------------------------------------------------- validation */

test('assessment validation catches the mistakes a hand edit makes', () => {
  assert.deepEqual(validateAssessment(scaffold()), []);
  const bad = scaffold();
  bad.controls['NOT-A-CONTROL'] = { checks: [] };
  bad.controls['GOV-1'].checks = ['met'];
  bad.controls['GOV-2'].targetDate = 'next Tuesday';
  bad.assessmentDate = 'soon';
  const problems = validateAssessment(bad);
  assert.ok(problems.some((p) => p.includes('NOT-A-CONTROL')));
  assert.ok(problems.some((p) => p.includes('GOV-1') && p.includes('catalog defines')));
  assert.ok(problems.some((p) => p.includes('targetDate')));
  assert.ok(problems.some((p) => p.includes('assessmentDate')));
  assert.deepEqual(validateAssessment(null), ['Assessment is not an object.']);
});

test('scaffold produces a file the scorer accepts', () => {
  const doc = scaffold({ profile: { usesCloud: false } });
  assert.equal(Object.keys(doc.controls).length, 28);
  assert.deepEqual(validateAssessment(doc), []);
  for (const c of Object.values(doc.controls)) {
    assert.ok(c.checks.every((s) => s === 'unknown'));
  }
});

/* --------------------------------------------------------------- plan */

test('the compliance window and its milestones are fixed by the Decision', () => {
  const stones = milestones();
  assert.deepEqual(stones.map((s) => s.due), ['2026-10-05', '2027-05-05', '2027-10-05']);
  const s = deadlineStatus(new Date('2026-09-03T00:00:00Z'));
  assert.equal(s.remainingDays, 397);
  assert.equal(s.overdue, false);
  assert.ok(s.elapsedPercent > 27 && s.elapsedPercent < 28);
  assert.equal(deadlineStatus(new Date('2027-12-01T00:00:00Z')).overdue, true);
});

test('prerequisites outrank the controls that depend on them', () => {
  const plan = buildPlan(build(), new Date('2026-09-03T00:00:00Z'));
  const rank = (id) => plan.backlog.findIndex((b) => b.id === id);
  assert.ok(rank('GOV-3') < rank('PR-5'), 'data classification should precede backup rules');
  assert.ok(rank('ID-1') < rank('DE-1'), 'the asset inventory should precede central logging');
  assert.ok(rank('GOV-1') < rank('GOV-5'), 'accountability should precede self assessment');
});

test('dependency edges only reference controls that exist', () => {
  for (const [from, to] of Object.entries(DEPENDENCIES)) {
    assert.ok(getControl(from), `dependency source ${from} is not a control`);
    for (const d of to) assert.ok(getControl(d), `dependency target ${d} is not a control`);
  }
});

test('a met control leaves the backlog', () => {
  const doc = scaffold();
  for (const c of CONTROLS) Object.assign(doc.controls[c.id], allChecks(c.id, 'met'));
  const plan = buildPlan(doc, new Date('2026-09-03T00:00:00Z'));
  assert.equal(plan.backlog.length, 0);
  assert.equal(plan.effort.totalPersonDays, 0);
  for (const p of plan.phases) assert.equal(p.openControls, 0);
});

test('prioritize marks what a control unblocks and what it waits on', () => {
  const rows = prioritize(assess(build()));
  const id3 = rows.find((r) => r.id === 'ID-3');
  assert.ok(id3.waitingOn.includes('GOV-3'));
  assert.ok(id3.unblocks.includes('PR-2'));
});

test('the evidence pack covers every applicable control', () => {
  const pack = evidencePack(build());
  assert.equal(Object.keys(pack.byControl).length, 44);
  assert.equal(pack.totalArtifacts, CATALOG_STATS.evidenceItems);
  assert.equal(pack.retentionYears, 3);
  const noCloud = evidencePack(scaffold({ profile: { usesCloud: false } }));
  assert.ok(!Object.keys(noCloud.byControl).some((id) => id.startsWith('CLD')));
});

/* --------------------------------------------------- evidence register */

function withEvidence(records) {
  const doc = build();
  doc.controls['GOV-1'].evidence = records;
  return doc;
}
const SEP = new Date('2026-09-03T00:00:00Z');

test('an empty register reports every artifact as missing', () => {
  const reg = evidenceRegister(build(), SEP);
  assert.equal(reg.totalArtifacts, CATALOG_STATS.evidenceItems);
  assert.equal(reg.counts.missing, reg.totalArtifacts);
  assert.equal(reg.coverage, 0);
  assert.equal(reg.producible, 0);
});

test('a fully recorded artifact is held and producible', () => {
  const reg = evidenceRegister(withEvidence([
    { item: 0, held: true, reference: 'DMS/1', collected: '2026-08-01' }
  ]), SEP);
  const row = reg.byControl['GOV-1'][0];
  assert.equal(row.state, 'held');
  assert.equal(row.ageDays, 33);
  assert.equal(row.retainUntil, '2029-08-01');
});

test('freshness is judged against the control cadence, not one global rule', () => {
  // DE-1 is weekly and RC-1 is annual, so the same date ages differently.
  const doc = build();
  doc.controls['DE-1'].evidence = [{ item: 0, held: true, reference: 'x', collected: '2026-05-01' }];
  doc.controls['RC-1'].evidence = [{ item: 0, held: true, reference: 'x', collected: '2026-05-01' }];
  const reg = evidenceRegister(doc, SEP);
  assert.equal(reg.byControl['DE-1'][0].state, 'stale');
  assert.equal(reg.byControl['RC-1'][0].state, 'held');
});

test('event driven controls never go stale, they only have to exist', () => {
  const doc = build();
  // GOV-4 fires per hire rather than on a schedule.
  assert.equal(getControl('GOV-4').cadence, 'per hire');
  assert.equal(REFRESH_DAYS['per hire'], null);
  doc.controls['GOV-4'].evidence = [{ item: 0, held: true, reference: 'x', collected: '2019-01-01' }];
  assert.equal(evidenceRegister(doc, SEP).byControl['GOV-4'][0].state, 'held');
});

test('held without a location cannot be produced on request', () => {
  const reg = evidenceRegister(withEvidence([
    { item: 0, held: true, reference: '', collected: '2026-08-01' }
  ]), SEP);
  assert.equal(reg.byControl['GOV-1'][0].state, 'unreferenced');
  assert.equal(reg.coverage, Math.round((1 / reg.totalArtifacts) * 1000) / 10);
  assert.equal(reg.producible, 0);
  assert.ok(reg.findings.some((f) => f.control === 'GOV-1' && f.issue.includes('no location')));
});

test('held without a date cannot be judged for freshness', () => {
  const reg = evidenceRegister(withEvidence([{ item: 0, held: true, reference: 'x' }]), SEP);
  assert.equal(reg.byControl['GOV-1'][0].state, 'undated');
  assert.ok(reg.findings.some((f) => f.control === 'GOV-1' && f.issue.includes('no collection date')));
});

test('a collection date in the future is a data error, not evidence', () => {
  const reg = evidenceRegister(withEvidence([
    { item: 0, held: true, reference: 'x', collected: '2027-01-01' }
  ]), SEP);
  assert.equal(reg.byControl['GOV-1'][0].state, 'misdated');
  assert.ok(reg.findings.some((f) => f.control === 'GOV-1' && f.issue.includes('future')));
});

test('a stale artifact names the threshold it passed', () => {
  const doc = build();
  doc.controls['DE-1'].evidence = [{ item: 0, held: true, reference: 'x', collected: '2026-01-01' }];
  const f = evidenceRegister(doc, SEP).findings.find((x) => x.control === 'DE-1' && x.issue.includes('stale'));
  assert.ok(f);
  assert.ok(f.issue.includes('cadence of weekly'));
  assert.ok(f.issue.includes(String(REFRESH_DAYS.weekly)));
});

test('the register ignores controls that are out of scope', () => {
  const doc = scaffold({ profile: { usesCloud: false } });
  const reg = evidenceRegister(doc, SEP);
  assert.ok(!Object.keys(reg.byControl).some((id) => id.startsWith('CLD')));
  assert.ok(reg.totalArtifacts < CATALOG_STATS.evidenceItems);
});

test('older free text evidence is kept but claims nothing it cannot show', () => {
  const records = readEvidenceRecords({ evidence: ['See GRC library'] }, getControl('GOV-1'));
  assert.equal(records[0].held, true);
  assert.equal(records[0].legacy, true);
  assert.equal(records[0].reference, '');
  assert.equal(records[0].collected, null);
  const reg = evidenceRegister(withEvidence(['See GRC library']), SEP);
  assert.equal(reg.byControl['GOV-1'][0].state, 'undated');
});

test('a record pointing at an artifact the catalog does not have is ignored', () => {
  const records = readEvidenceRecords({ evidence: [{ item: 99, held: true }] }, getControl('GOV-1'));
  assert.equal(records.length, getControl('GOV-1').evidence.length);
  assert.ok(records.every((r) => !r.held));
});

test('a claim with nothing behind it is surfaced separately', () => {
  const doc = build({ 'RC-2': allChecks('RC-2', 'met') });
  const claims = unevidencedClaims(doc, assess(doc), SEP);
  assert.ok(claims.some((c) => c.control === 'RC-2'));
  // Recording the evidence clears the claim.
  doc.controls['RC-2'].evidence = getControl('RC-2').evidence.map((_, i) => ({
    item: i, held: true, reference: `REF/${i}`, collected: '2026-08-01'
  }));
  assert.ok(!unevidencedClaims(doc, assess(doc), SEP).some((c) => c.control === 'RC-2'));
});

test('a control nobody claims is not listed as an unevidenced claim', () => {
  const doc = build({ 'RC-2': allChecks('RC-2', 'gap') });
  assert.ok(!unevidencedClaims(doc, assess(doc), SEP).some((c) => c.control === 'RC-2'));
});

test('the register CSV has one row per artifact and balanced quoting', () => {
  const csv = renderRegisterCSV(build(), SEP);
  const lines = csv.trim().split('\n');
  assert.equal(lines.length - 1, CATALOG_STATS.evidenceItems);
  assert.ok(lines[0].startsWith('control,control_title'));
  for (const line of lines.slice(1)) {
    const bare = line.replace(/"(?:[^"]|"")*"/g, '');
    assert.equal(bare.split(',').length, 16, `unbalanced row: ${line.slice(0, 60)}`);
  }
  assert.ok(csv.includes('كتاب تكليف'), 'the register carries the Arabic artifact name');
});

test('the shipped example demonstrates each register state', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const reg = evidenceRegister(doc, SEP);
  assert.ok(reg.counts.held > 0, 'expected held artifacts');
  assert.ok(reg.counts.stale > 0, 'expected a stale artifact');
  assert.ok(reg.counts.unreferenced > 0, 'expected one with no location');
  assert.ok(reg.counts.missing > 0, 'expected missing artifacts');
  assert.ok(unevidencedClaims(doc, assess(doc), SEP).length > 0);
});

test('cli evidence prints the register and its narrowed views', () => {
  const full = cli(['evidence', EXAMPLE, '--date', '2026-09-03']);
  assert.ok(full.includes('Evidence register'));
  assert.ok(full.includes('Claimed but unevidenced'));
  const stale = cli(['evidence', EXAMPLE, '--date', '2026-09-03', '--stale']);
  assert.ok(stale.includes('GOV-6'));
  assert.ok(!stale.includes('Claimed but unevidenced'));
  assert.doesNotThrow(() => JSON.parse(cli(['evidence', EXAMPLE, '--json', '--date', '2026-09-03'])));
});

test('cli exports the register as CSV', () => {
  const csv = cli(['export', EXAMPLE, '--as', 'register', '--date', '2026-09-03']);
  assert.ok(csv.startsWith('control,control_title'));
  assert.equal(csv.trim().split('\n').length - 1, CATALOG_STATS.evidenceItems);
});

test('a generated document is not given a second trailing newline', () => {
  // A doubled newline becomes a phantom empty row when a spreadsheet opens it.
  for (const as of ['csv', 'register', 'md', 'json']) {
    const body = cli(['export', EXAMPLE, '--as', as, '--date', '2026-09-03']);
    assert.ok(!body.endsWith('\n\n'), `${as} export ends with a blank line`);
    assert.ok(body.endsWith('\n'), `${as} export has no trailing newline`);
  }
  const reg = cli(['evidence', EXAMPLE, '--csv', '--date', '2026-09-03']);
  assert.ok(!reg.endsWith('\n\n'));
});

test('the report carries the register and names unevidenced claims', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const html = renderReport(doc, { today: SEP });
  assert.ok(html.includes('Evidence register'));
  assert.ok(html.includes('Controls claimed with nothing to show'));
  assert.ok(html.includes('Evidence that has gone stale'));
  assert.ok(!html.includes('undefined'));
});

/* ------------------------------------------------------ trend and forecast */

function snapshot(date, share) {
  const doc = scaffold();
  doc.assessmentDate = date;
  doc.entity = { name: 'Series entity' };
  for (const c of CONTROLS) {
    const n = c.checks.length;
    const target = Math.round(n * share);
    doc.controls[c.id].checks = c.checks.map((_, i) => (i < target ? 'met' : 'unknown'));
    doc.controls[c.id].owner = 'Owner';
  }
  return doc;
}

test('a trend needs at least two snapshots on different dates', () => {
  assert.equal(forecast([]).ok, false);
  assert.equal(forecast([snapshot('2026-01-01', 0.2)]).ok, false);
  const same = forecast([snapshot('2026-01-01', 0.2), snapshot('2026-01-01', 0.4)]);
  assert.equal(same.ok, false);
  assert.match(same.reason, /same date/);
});

test('snapshots are ordered by date regardless of how they arrive', () => {
  const { points } = buildSeries([
    snapshot('2026-06-01', 0.5), snapshot('2026-01-01', 0.2), snapshot('2026-03-01', 0.35)
  ]);
  assert.deepEqual(points.map((p) => p.date), ['2026-01-01', '2026-03-01', '2026-06-01']);
});

test('a snapshot with no usable date is reported rather than dropped silently', () => {
  const bad = snapshot('2026-01-01', 0.2);
  delete bad.assessmentDate;
  const { points, rejected } = buildSeries([bad, snapshot('2026-03-01', 0.4)]);
  assert.equal(points.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /assessmentDate/);
});

test('a steady climb that reaches the baseline in time reads as on track', () => {
  const f = forecast([
    snapshot('2025-12-01', 0.15), snapshot('2026-03-01', 0.4),
    snapshot('2026-06-01', 0.65), snapshot('2026-09-01', 0.9)
  ], { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.equal(f.ok, true);
  assert.equal(f.implementation.verdict, 'on track');
  assert.equal(f.implementation.projectedAtDeadline, 100);
  assert.ok(f.implementation.completionDate < REGULATION.deadline);
  assert.ok(f.implementation.perMonth > 0);
});

test('a slow climb is called behind and says what rate would be needed', () => {
  const f = forecast([
    snapshot('2025-12-01', 0.10), snapshot('2026-03-01', 0.14),
    snapshot('2026-06-01', 0.17), snapshot('2026-09-01', 0.20)
  ], { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.equal(f.implementation.verdict, 'behind');
  assert.ok(f.implementation.projectedAtDeadline < 100);
  assert.ok(f.implementation.shortfall > 0);
  assert.ok(f.implementation.neededPerMonth > f.implementation.perMonth);
});

test('a series that goes backwards is called regressing, not behind', () => {
  const f = forecast([
    snapshot('2026-01-01', 0.5), snapshot('2026-04-01', 0.4), snapshot('2026-07-01', 0.3)
  ], { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.equal(f.implementation.verdict, 'regressing');
  assert.equal(f.implementation.completionDate, null);
  assert.ok(f.implementation.changeTotal < 0);
});

test('a flat series is stalled and offers no completion date', () => {
  const f = forecast([
    snapshot('2026-01-01', 0.4), snapshot('2026-04-01', 0.4), snapshot('2026-07-01', 0.4)
  ], { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.ok(['stalled', 'regressing'].includes(f.implementation.verdict));
  assert.equal(f.implementation.perMonth, 0);
  assert.equal(f.implementation.completionDate, null);
});

test('a sharp change in recent pace is flagged so the line is not trusted blindly', () => {
  const f = forecast([
    snapshot('2026-01-01', 0.10), snapshot('2026-04-01', 0.50), snapshot('2026-07-01', 0.52)
  ], { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.ok(Math.abs(f.recentRateDriftPercent) >= 25,
    'a programme that stopped after a fast start should be flagged');
});

test('functions are ranked worst projection first so laggards surface', () => {
  const docs = ['2025-12-01', '2026-03-01', '2026-06-01'].map((d, i) => {
    const doc = snapshot(d, 0.2 + i * 0.2);
    // Hold the cloud function back while everything else advances.
    for (const c of CONTROLS.filter((x) => x.fn === 'CLD')) {
      doc.controls[c.id].checks = c.checks.map(() => 'unknown');
    }
    return doc;
  });
  const f = forecast(docs, { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.equal(f.byFunction[0].fn, 'CLD');
  assert.ok(f.byFunction[0].projectedAtDeadline < f.byFunction[f.byFunction.length - 1].projectedAtDeadline);
  assert.ok(f.laggards.some((l) => l.fn === 'CLD'));
});

test('evidence is projected alongside implementation', () => {
  const f = forecast([snapshot('2026-01-01', 0.3), snapshot('2026-06-01', 0.6)],
    { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.ok(f.evidence);
  assert.equal(typeof f.evidence.projectedAtDeadline, 'number');
  assert.equal(f.evidence.current, 0, 'these snapshots record no evidence at all');
});

test('the shipped snapshots form a usable series', () => {
  const dir = resolve(root, 'templates/snapshots');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  assert.ok(files.length >= 3, 'expected several example snapshots');
  const docs = files.map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
  for (const d of docs) assert.deepEqual(validateAssessment(d), []);
  const f = forecast(docs, { asOf: new Date('2026-09-03T00:00:00Z') });
  assert.equal(f.ok, true);
  assert.equal(f.snapshots, files.length);
  assert.ok(f.implementation.perMonth > 0, 'the example series should show progress');
  assert.ok(f.laggards.length > 0, 'the example should leave one function behind');
});

test('cli trend refuses a single file and reports on a series', () => {
  assert.throws(() => cli(['trend', EXAMPLE]), (e) => /at least two/.test(String(e.stderr)));
  const dir = resolve(root, 'templates/snapshots');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => resolve(dir, f));
  const outText = cli(['trend', ...files, '--date', '2026-09-03']);
  assert.ok(outText.includes('The series'));
  assert.ok(outText.includes('Forecast'));
  assert.ok(outText.includes('By function'));
  assert.doesNotThrow(() => JSON.parse(cli(['trend', ...files, '--json', '--date', '2026-09-03'])));
});

test('asOf overrides the assessment date so a lapsed exception is caught', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const asRecorded = assess(doc);
  const later = assess(doc, { asOf: new Date('2027-08-01T00:00:00Z') });
  const expired = (r) => r.findings.filter((f) => f.issue.includes('expired')).length;
  assert.ok(expired(later) > expired(asRecorded),
    'exceptions valid on the assessment date should lapse when judged later');
  assert.ok(later.scores.posture < asRecorded.scores.posture);
});

/* ------------------------------------------------------------ portfolio */

function entity(name, share, opts = {}) {
  const doc = scaffold({ profile: { usesCloud: opts.usesCloud !== false, hasPublicAccounts: true } });
  doc.entity = { name, sector: opts.sector || 'Test' };
  doc.assessmentDate = '2026-09-01';
  for (const id of Object.keys(doc.controls)) {
    const n = getControl(id).checks.length;
    const s = (opts.weak || []).includes(id) ? 0 : share;
    const target = Math.round(n * s);
    doc.controls[id].checks = getControl(id).checks.map((_, i) => (i < target ? 'met' : 'unknown'));
    doc.controls[id].owner = 'Owner';
  }
  return doc;
}
const SEP3 = new Date('2026-09-03T00:00:00Z');

test('a roll up summarises every entity and the spread between them', () => {
  const r = rollUp([entity('A', 0.9), entity('B', 0.5), entity('C', 0.3)], { asOf: SEP3 });
  assert.equal(r.entities, 3);
  assert.equal(r.scores.highest, r.list.find((e) => e.name === 'A').implementation);
  assert.equal(r.scores.lowest, r.list.find((e) => e.name === 'C').implementation);
  assert.equal(r.scores.spread, round1(r.scores.highest - r.scores.lowest));
  assert.ok(r.scores.meanImplementation > r.scores.lowest);
  assert.ok(r.scores.meanImplementation < r.scores.highest);
});

function round1(n) { return Math.round(n * 10) / 10; }

test('a control failing across most entities is systemic, one failing at few is not', () => {
  const weak = ['DE-1'];
  const r = rollUp([
    entity('A', 0.95, { weak }), entity('B', 0.95, { weak }),
    entity('C', 0.95, { weak }), entity('D', 0.95)
  ], { asOf: SEP3 });
  const de1 = r.systemic.find((c) => c.id === 'DE-1');
  assert.ok(de1, 'DE-1 fails at three of four and should be systemic');
  assert.equal(de1.entitiesFailing, 3);
  assert.equal(de1.entitiesApplicable, 4);
  assert.ok(de1.failShare >= SYSTEMIC_SHARE * 100);

  const one = rollUp([entity('A', 0.95, { weak: ['RC-2'] }), entity('B', 0.95),
    entity('C', 0.95), entity('D', 0.95)], { asOf: SEP3 });
  assert.ok(!one.systemic.some((c) => c.id === 'RC-2'));
  assert.ok(one.isolated.some((c) => c.id === 'RC-2'));
});

test('a systemic control names which entities are failing it', () => {
  const r = rollUp([entity('Alpha', 0.9, { weak: ['DE-2'] }), entity('Beta', 0.9, { weak: ['DE-2'] }),
    entity('Gamma', 0.9)], { asOf: SEP3 });
  const de2 = r.systemic.find((c) => c.id === 'DE-2');
  assert.deepEqual(de2.failingNames.sort(), ['Alpha', 'Beta']);
});

test('out of scope controls shrink the denominator rather than counting as failures', () => {
  const r = rollUp([
    entity('Cloudy', 0.9), entity('Cloudy2', 0.9), entity('OnPrem', 0.9, { usesCloud: false })
  ], { asOf: SEP3 });
  const cld = r.controls.find((c) => c.id === 'CLD-1');
  assert.equal(cld.entitiesApplicable, 2, 'the entity with no cloud is not counted');
  const gov = r.controls.find((c) => c.id === 'GOV-1');
  assert.equal(gov.entitiesApplicable, 3);
});

test('a single entity portfolio has no systemic finding to make', () => {
  const r = rollUp([entity('Solo', 0.2)], { asOf: SEP3 });
  assert.equal(r.entities, 1);
  assert.equal(r.systemic.length, 0, 'one entity cannot establish a group pattern');
});

test('entities are ranked by exposure, not alphabetically', () => {
  const r = rollUp([entity('Zeta', 0.95), entity('Alpha', 0.2), entity('Mid', 0.6)], { asOf: SEP3 });
  assert.equal(r.ranked[0].name, 'Alpha');
  assert.equal(r.ranked[r.ranked.length - 1].name, 'Zeta');
});

test('a set of files sharing one entity name is flagged as probably a time series', () => {
  const r = rollUp([entity('Same', 0.3), entity('Same', 0.6)], { asOf: SEP3 });
  assert.equal(r.looksLikeSeries, true);
  assert.deepEqual(r.duplicateNames, ['Same']);
  const mixed = rollUp([entity('A', 0.3), entity('B', 0.6)], { asOf: SEP3 });
  assert.equal(mixed.looksLikeSeries, false);
  assert.deepEqual(mixed.duplicateNames, []);
});

test('functions are ranked weakest mean first with the range shown', () => {
  const r = rollUp([entity('A', 0.9, { weak: ['DE-1', 'DE-2'] }), entity('B', 0.9)], { asOf: SEP3 });
  assert.equal(r.byFunction[0].fn, 'DE');
  assert.ok(r.byFunction[0].lowest <= r.byFunction[0].mean);
  assert.ok(r.byFunction[0].highest >= r.byFunction[0].mean);
});

test('the portfolio CSV has one row per entity and balanced quoting', () => {
  const csv = renderPortfolioCSV([entity('A, Inc', 0.4), entity('B "quoted"', 0.7)], { asOf: SEP3 });
  const lines = csv.trim().split('\n');
  assert.equal(lines.length - 1, 2);
  assert.ok(lines[0].startsWith('entity,sector'));
  for (const line of lines.slice(1)) {
    const bare = line.replace(/"(?:[^"]|"")*"/g, '');
    assert.equal(bare.split(',').length, 13, `unbalanced row: ${line.slice(0, 50)}`);
  }
  assert.ok(csv.includes('""quoted""'), 'a quote inside a field must be doubled');
});

test('cli portfolio refuses one file and reports systemic gaps', () => {
  assert.throws(() => cli(['portfolio', EXAMPLE]), (e) => /at least two/.test(String(e.stderr)));
  const dir = resolve(root, 'templates/snapshots');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => resolve(dir, f));
  const text = cli(['portfolio', ...files, '--date', '2026-09-03']);
  assert.ok(text.includes('Portfolio'));
  assert.ok(text.includes('Entities'));
  assert.ok(text.includes('By function'));
  // The snapshots are one entity over time, which the command should notice.
  assert.ok(text.includes('nbcc trend'), 'a time series passed here should be redirected');
  assert.doesNotThrow(() => JSON.parse(cli(['portfolio', ...files, '--json', '--date', '2026-09-03'])));
});

/* ------------------------------------------------ language separation */

const ARABIC = /[\u0600-\u06FF]/;

// Latin text that legitimately survives in Arabic output: framework and
// protocol names, control ids, flags, and the entity's own data.
const LATIN_OK = new Set(`NIST CSF ISO CIS GOV NCSC SOC CSA STAR Type Bayan Holding Group
Internal audit and GRC Kuwait NBCC Toolkit CLD Lead Cloud Platform Owner Infrastructure
Head Risk Compliance Security Operations Manager HR Officer Data Network Team IT Director
Asset SPF DKIM DMARC TLS MFA OIDC SLA Business Continuity Incident Response nbcc show csv
stale missing systemic json trend report evidence assess met partial gap exception na
unknown DMS SEC POL SUB DATA SAMPLES ITAM EXPORT DISCOVERY SW APPROVED PROC VEND REGISTER
SCOPE IR APPOINT CONTACTS BCP PLAN RUNBOOKS CSP CERTS DD CLOUD ORGPOL PAB SCAN SIEM CONFIG
VM SCANS TRACKER ORG PUBLISHED RET PROOF SA GAPS CHANGELOG EXC`.split(/\s+/));

test('no command leaks one language into the other', () => {
  // The audit that found English labels sitting inside Arabic output, kept as
  // a test so a new command cannot reintroduce them.
  const snaps = readdirSync(resolve(root, 'templates/snapshots'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => resolve(root, 'templates/snapshots', f));
  const commands = [
    ['catalog'], ['catalog', '--fn', 'GOV'], ['show', 'GOV-6'], ['show', 'CLD-11'],
    ['search', 'MFA'], ['deadline'], ['crosswalk'], ['doctor'],
    ['assess', EXAMPLE, '--date', '2026-09-03'],
    ['plan', EXAMPLE, '--date', '2026-09-03'],
    ['evidence', EXAMPLE, '--date', '2026-09-03'],
    ['trend', ...snaps, '--date', '2026-09-03']
  ];
  for (const args of commands) {
    const en = cli(args);
    assert.ok(!ARABIC.test(en), `${args[0]} leaked Arabic into English output`);

    const ar = cli([...args, '--ar']);
    // The official English text is printed deliberately, under its own heading.
    const body = ar.split('النص الرسمي بالإنجليزية')[0].replace(/\S*\/\S*/g, ' ');
    const stray = [...new Set(body.match(/[A-Za-z]{3,}/g) || [])].filter((w) => !LATIN_OK.has(w));
    assert.deepEqual(stray, [], `${args[0]} leaked English into Arabic output: ${stray.join(', ')}`);
    assert.ok(ARABIC.test(ar), `${args[0]} produced no Arabic at all`);
  }
});

test('English output carries no Arabic anywhere', () => {
  // Mixing the scripts is what made the tool feel like a demo rather than an
  // instrument, so both directions are asserted rather than eyeballed.
  const commands = [
    ['catalog'], ['show', 'GOV-6'], ['deadline'], ['crosswalk'], ['doctor'], ['help'],
    ['assess', EXAMPLE, '--date', '2026-09-03'],
    ['plan', EXAMPLE, '--date', '2026-09-03'],
    ['evidence', EXAMPLE, '--date', '2026-09-03']
  ];
  for (const args of commands) {
    const text = cli(args);
    assert.ok(!ARABIC.test(text), `${args[0]} leaked Arabic into English output`);
  }
});

test('the English report carries no Arabic', () => {
  const html = renderReport(JSON.parse(readFileSync(EXAMPLE, 'utf8')), { today: SEP });
  assert.ok(!ARABIC.test(html), 'the English report leaked Arabic');
});

test('the Arabic report is Arabic throughout', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const html = renderReport(doc, { today: SEP, lang: 'ar' });
  assert.ok(html.includes('dir="rtl"'), 'the document direction must flip');
  assert.ok(html.includes('lang="ar"'));
  assert.ok(html.includes('سجل الأدلة'), 'section headings should be Arabic');
  assert.ok(html.includes('نسبة التطبيق'));
  assert.ok(html.includes('مستوفى') || html.includes('جزئي'), 'status pills should be Arabic');
  assert.ok(html.includes('التأسيس'), 'milestone labels should be Arabic');
  assert.ok(!html.includes('>Where the entity stands<'));
  assert.ok(!html.includes('>Evidence register<'));
  assert.ok(!html.includes('undefined'));

  // Article 6 keeps the English authoritative, so it must still be present.
  assert.ok(html.includes('ترجمة عاملة'), 'the Arabic requirement must be labelled a translation');
  assert.ok(html.includes('النص الرسمي بالإنجليزية'));
  assert.ok(html.includes('The entity MUST designate an employee'), 'official text must survive');
});

test('Arabic gets Arabic typography, not Latin typography flipped', () => {
  // The script is connected, so the negative tracking that tightens a Latin
  // headline crushes the joins between Arabic letters. Arabic also sits taller
  // on the line and needs more leading to read at the same comfort.
  const surfaces = [
    ['report', renderReport(scaffold(), { today: SEP, lang: 'ar' })],
    ['workbench', buildSite()]
  ];
  for (const [name, html] of surfaces) {
    assert.ok(/\[dir=rtl\]\s*h1[^{]*\{[^}]*letter-spacing:\s*normal/.test(html),
      `${name} still applies Latin tracking to Arabic headings`);
    assert.ok(/\[dir=rtl\]\s*body\{[^}]*line-height:\s*1\.8/.test(html),
      `${name} gives Arabic the same leading as Latin`);
  }
  // And the Latin default must stay negative, since that is correct for Latin.
  assert.ok(/h1,h2,h3,h4\{[^}]*letter-spacing:-\.0/.test(buildSite()),
    'the Latin headings should keep their tracking');
});

test('the report is built to survive being printed', () => {
  // The report reaches a board and eventually the regulator as a PDF. Without
  // these rules a table row splits across a page boundary, a heading is
  // stranded at the foot of one page with its table on the next, and the
  // colour that carries meaning is dropped by the print pipeline.
  const html = renderReport(JSON.parse(readFileSync(EXAMPLE, 'utf8')), { today: SEP });
  const print = html.slice(html.indexOf('@media print'), html.indexOf('</style>'));
  assert.ok(print.length > 200, 'the report has no print stylesheet');
  for (const rule of [
    'tr, .fnrow, .finding',            // a row must not split
    'break-after: avoid',              // a heading stays with its content
    'print-color-adjust: exact',       // pills and bars keep their meaning
    'details.ctl { break-inside: avoid-page',
    'table.backlog { table-layout: fixed'
  ]) {
    assert.ok(print.includes(rule), `the print stylesheet is missing: ${rule}`);
  }
  // Every control has to be open on paper, since a reader cannot expand one.
  assert.ok(print.includes('details > div { display: block !important'));
});

test('each language keeps one numeral system and one percent sign', () => {
  // The Arabic report was mixing eighteen Arabic Indic numerals into fifteen
  // hundred Western ones, because the long form dates came from a locale that
  // formats digits while every other figure in the document is Western.
  const strip = (html) => html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, ' ');
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));

  const ar = strip(renderReport(doc, { today: SEP, lang: 'ar' }));
  assert.equal((ar.match(/[\u0660-\u0669]/g) || []).length, 0,
    'the Arabic report must not mix Arabic Indic digits into Western ones');
  assert.equal((ar.match(/\d%/g) || []).length, 0,
    'Arabic takes the Arabic percent sign');
  assert.ok((ar.match(/\u066A/g) || []).length > 20, 'the Arabic sign should be in use');

  const en = strip(renderReport(doc, { today: SEP }));
  assert.equal((en.match(/\u066A/g) || []).length, 0,
    'the English report must not carry the Arabic percent sign');
  assert.ok((en.match(/\d%/g) || []).length > 20);

  // The workbench needs the same rule, and it has its own renderer.
  assert.ok(buildSite().includes('function pctSign'),
    'the workbench must pick its percent sign by language');
});

test('the two reports differ only in language, not in numbers', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const en = renderReport(doc, { today: SEP });
  const ar = renderReport(doc, { today: SEP, lang: 'ar' });
  const r = assess(doc);
  // The sign differs by language now, so compare the figures themselves.
  for (const [html, sign] of [[en, '%'], [ar, '\u066A']]) {
    assert.ok(html.includes(`${r.scores.implementation}${sign}`),
      `implementation is missing or carries the wrong percent sign`);
    assert.ok(html.includes(`${r.scores.posture}${sign}`),
      `posture is missing or carries the wrong percent sign`);
  }
});

test('report findings carry both languages', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const r = assess(doc);
  assert.ok(r.findings.length > 0);
  for (const f of r.findings) {
    assert.ok(f.issueAr && ARABIC.test(f.issueAr), `finding on ${f.control} has no Arabic issue`);
    assert.ok(f.fixAr && ARABIC.test(f.fixAr), `finding on ${f.control} has no Arabic fix`);
  }
  const reg = evidenceRegister(doc, SEP);
  for (const f of reg.findings) {
    assert.ok(f.issueAr && ARABIC.test(f.issueAr), `evidence finding on ${f.control} has no Arabic`);
  }
});

test('cli report takes the language flag', () => {
  const outPath = resolve(root, 'test-ar-report.html');
  try {
    cli(['report', EXAMPLE, '--out', outPath, '--date', '2026-09-03', '--ar']);
    const html = readFileSync(outPath, 'utf8');
    assert.ok(html.includes('dir="rtl"'));
    assert.ok(html.includes('سجل الأدلة'));
  } finally {
    try { unlinkSync(outPath); } catch { /* already gone */ }
  }
});

test('Arabic output leads in Arabic and keeps the official text reachable', () => {
  const text = cli(['show', 'GOV-6', '--ar']);
  assert.ok(ARABIC.test(text));
  assert.ok(text.includes('الحد الأدنى المطلوب'));
  assert.ok(text.includes('ترجمة عاملة'), 'the translation must be labelled as working, not official');
  assert.ok(text.includes('النص الرسمي بالإنجليزية'), 'the authoritative text must still be printed');
  assert.ok(text.includes('Establish and maintain an inventory'), 'the official English must follow');
  assert.ok(!text.includes('Purpose'), 'English section headings should not appear in Arabic output');
});

test('the Arabic catalog listing uses Arabic titles and headings', () => {
  const text = cli(['catalog', '--fn', 'GOV', '--ar']);
  assert.ok(text.includes('الحوكمة والأدوار'));
  assert.ok(!text.includes('Governance & Roles'));
  assert.ok(!text.includes('checks'), 'the English unit label should not appear');
});

/* ------------------------------------------------------------ checklists */

test('the role split is a partition of the whole baseline', () => {
  // This is the property that makes the split worth having. Hand each desk its
  // sheet and between them everything is covered, nothing twice and nothing
  // dropped. A control owned by nobody is the failure GOV-1 exists to prevent.
  assert.deepEqual(validateRoles(), []);
  const owned = ROLES.flatMap((r) => r.controls);
  assert.equal(owned.length, new Set(owned).size, 'a control is owned twice');
  assert.equal(owned.length, CONTROLS.length, 'a control is owned by nobody');
  assert.deepEqual([...owned].sort(), CONTROLS.map((c) => c.id).sort());
  assert.equal(CHECKLIST_STATS.checks, CATALOG_STATS.checks);
});

test('a checklist respects scope and the filters', () => {
  const all = buildChecklist({});
  assert.equal(all.controls, 44);
  assert.equal(all.checks, CATALOG_STATS.checks);

  // An entity with no cloud should not be handed the Appendix A sheet.
  const onPrem = buildChecklist({ profile: { usesCloud: false } });
  assert.equal(onPrem.controls, 28);
  assert.ok(!onPrem.sections.some((s) => s.role.id === 'cloud'));

  const phase1 = buildChecklist({ phase: 1 });
  assert.ok(phase1.controls > 0 && phase1.controls < 44);
  assert.ok(phase1.sections.every((s) => s.controls.every((c) => c.phase === 1)));

  const gov = buildChecklist({ fn: 'GOV' });
  assert.ok(gov.sections.every((s) => s.controls.every((c) => c.fn === 'GOV')));
});

test('a checklist prints a tick box for every check and every artifact', () => {
  for (const role of ROLES) {
    const md = renderChecklist({ role: role.id });
    const built = buildChecklist({ role: role.id });
    const boxes = (md.match(/- \[ \]/g) || []).length;
    assert.equal(boxes, built.checks + built.sections[0].evidence,
      `${role.id} does not offer a box for every check and artifact`);
    for (const c of built.sections[0].controls) {
      for (const check of c.checks) assert.ok(md.includes(check), `${role.id} lost a ${c.id} check`);
    }
  }
});

test('a checklist says the role assignment is not the Annex talking', () => {
  // GOV-1 is the only place the instrument names a role, so an entity must not
  // read this split as something the regulator prescribed.
  for (const lang of ['en', 'ar']) {
    const md = renderChecklist({ role: 'hr', lang });
    const claim = lang === 'ar' ? 'اجتهاد هذه الأداة' : "this project's own reading";
    assert.ok(md.includes(claim), `${lang} checklist does not disclaim the assignment`);
    assert.ok(md.includes('GOV-1'), `${lang} checklist does not cite GOV-1`);
  }
  // The national obligation and beyond the Annex markings carry through.
  assert.ok(renderChecklist({ role: 'hr' }).includes('national obligation'));
  assert.ok(renderChecklist({ role: 'leadership' }).includes('beyond the Annex'));
});

test('cli checklist lists the roles and writes a sheet', () => {
  const list = cli(['checklist']);
  assert.ok(list.includes('Field checklists'));
  assert.ok(list.includes('it-operations'));
  assert.throws(() => cli(['checklist', 'nobody']), (e) => /unknown role/.test(String(e.stderr)));
  const sheet = cli(['checklist', 'facilities']);
  assert.ok(sheet.includes('1 control, 8 checks'), 'counts should read naturally at one');
  const ar = cli(['checklist', 'hr', '--ar']);
  assert.ok(ar.includes('للموارد البشرية'), 'the preposition must assimilate into the article');
  assert.ok(ar.includes('ضابطان'), 'two controls takes the dual');
});

/* -------------------------------------------------- national obligations */

test('controls owed to a Kuwaiti authority are marked as such', () => {
  // Every one of the 44 maps to ISO, CIS and NIST, so a crosswalk alone would
  // tell an entity that its certification covers everything. It does not. Nine
  // controls require an act toward the State that no standard discharges.
  const marked = CONTROLS.filter((c) => c.nationalObligation);
  assert.equal(marked.length, 9);
  assert.equal(CATALOG_STATS.nationalObligations, 9);
  assert.deepEqual(marked.map((c) => c.id),
    ['GOV-3', 'GOV-4', 'GOV-5', 'PR-5', 'RS-1', 'RS-2', 'CLD-1', 'CLD-11', 'CLD-12']);
  for (const c of marked) {
    assert.ok(c.nationalObligation.en, `${c.id} has no reason in English`);
    assert.ok(/[\u0600-\u06FF]/.test(c.nationalObligation.ar), `${c.id} has no reason in Arabic`);
  }
});

test('a marked control actually names a Kuwaiti authority or instrument', () => {
  // The marking has to be checkable against the requirement, not asserted.
  const NATIONAL = /NCSC|Kuwait|national authorities|National Data Classification|Decision \(1\)|Decision No\./i;
  for (const c of CONTROLS.filter((x) => x.nationalObligation)) {
    assert.ok(NATIONAL.test(c.requirement),
      `${c.id} is marked national but its requirement names no Kuwaiti authority`);
  }
});

test('the national obligation reaches the reader, not just its own command', () => {
  const site = buildSite();
  assert.ok(site.includes('nationalObligation'), 'the payload must carry it');
  assert.ok(site.includes('nationalHTML'), 'the workbench must render it');
  const shown = execFileSync(process.execPath, [CLI, 'national'], { encoding: 'utf8' });
  assert.ok(shown.includes('National obligations'));
  assert.ok(shown.includes('GOV-4'));
  assert.ok(shown.includes('No international certification discharges these'));
  const ar = execFileSync(process.execPath, [CLI, 'national', '--ar'], { encoding: 'utf8' });
  assert.ok(ar.includes('الالتزامات الوطنية'));
});

/* ------------------------------------------------------ starter drafts */

test('every policy GOV-2 names by hand has a draft behind it', () => {
  assert.deepEqual(validateDocuments(), []);
  // GOV-2 lists seven policies. A toolkit that reports them as missing and
  // hands the entity nothing to start from has done only half the work.
  for (const id of ['acceptable-use', 'secure-configuration', 'data-classification',
    'access-control', 'backup-recovery', 'incident-response', 'third-party']) {
    assert.ok(getDocument(id), `GOV-2 names a policy with no draft: ${id}`);
  }
  assert.equal(DRAFT_STATS.documents, 12);
  assert.ok(DRAFT_STATS.controlsCovered >= 30);
});

test('a draft clause always traces to a real check', () => {
  // The clauses are generated rather than written, so a document that
  // satisfies the draft satisfies what the assessment tests.
  for (const doc of DOCUMENTS) {
    const md = renderDraft(doc.id);
    for (const cid of doc.controls) {
      const c = getControl(cid);
      assert.ok(md.includes(c.title), `${doc.id} does not name ${cid}`);
      for (const check of c.checks) {
        assert.ok(md.includes(check), `${doc.id} is missing a clause for a ${cid} check`);
      }
      for (const e of c.evidence) {
        assert.ok(md.includes(e), `${doc.id} does not list the evidence for ${cid}`);
      }
    }
  }
});

test('a draft says on its face that it is not official', () => {
  for (const doc of DOCUMENTS) {
    for (const lang of ['en', 'ar']) {
      const md = renderDraft(doc.id, { lang });
      const disclaimer = lang === 'ar' ? 'ليست وثيقة رسمية' : 'not an official instrument';
      assert.ok(md.includes(disclaimer), `${doc.id} in ${lang} carries no disclaimer`);
      assert.ok(md.startsWith('# '), `${doc.id} in ${lang} has no title`);
    }
  }
});

test('a draft carries the beyond the Annex marking through', () => {
  // GOV-1 has a check that goes past the requirement, so the policy generated
  // from it has to say which clause the regulation does not actually demand.
  const md = renderDraft('roles');
  assert.ok(md.includes('beyond the Annex'), 'the marking is lost in the draft');
  const ar = renderDraft('roles', { lang: 'ar' });
  assert.ok(ar.includes('زائد على الملحق'));
});

test('drafts render in Arabic without falling back to English', () => {
  const md = renderDraft('incident-response', { lang: 'ar' });
  assert.ok(/[\u0600-\u06FF]/.test(md));
  assert.ok(!md.includes('Starter document'));
  assert.ok(!md.includes('Controls covered'));
  assert.ok(md.includes('وثيقة مبدئية'));
});

test('the workbench and the command line generate the same draft', () => {
  // Two implementations of one document is how a workbench copy quietly drifts
  // from the authoritative one, so the outputs are compared word for word.
  const site = buildSite();
  assert.ok(site.includes('function draftMarkdown'), 'the workbench needs its own generator');
  assert.ok(site.includes('documents: DOCUMENTS') || site.includes('"documents"'),
    'the payload must carry the document list');
  // The wording each side prints has to match, or the two documents differ.
  for (const key of ['docStarter', 'docNotOfficial', 'docCoversH', 'docGenerated',
    'docClauses', 'docClauseNote', 'docEvidenceH', 'docColumns', 'docOneRow']) {
    assert.ok(site.includes(`${key}:`), `the workbench is missing the string ${key}`);
  }
  // And every document must be reachable from the browser.
  for (const d of DOCUMENTS) {
    assert.ok(site.includes(`"${d.id}"`), `${d.id} is not in the shipped payload`);
  }
});

test('cli draft lists the documents and writes one', () => {
  const list = cli(['draft']);
  assert.ok(list.includes('Starter documents'));
  assert.ok(list.includes('acceptable-use'));
  assert.throws(() => cli(['draft', 'no-such-doc']), (e) => /unknown document/.test(String(e.stderr)));
  const body = cli(['draft', 'physical-security']);
  assert.ok(body.includes('# Physical Protection of IT Assets Policy'));
  assert.ok(body.includes(getControl('PR-6').checks[0]));
});

/* ---------------------------------------------------------- crosswalk */

test('every control maps to all three frameworks', () => {
  assert.deepEqual(validateCrosswalk(), []);
  assert.equal(crosswalkTable().length, 44);
  assert.equal(Object.keys(ISO_MAP).length, 44);
});

test('the reverse index answers what an existing control buys you', () => {
  const cis = reverseIndex('cis');
  const mfa = cis.find((r) => r.ref === '6.5');
  assert.ok(mfa.controls.includes('PR-2'));
  assert.ok(mfa.controls.includes('CLD-9'));
  assert.equal(reverseIndex('nope'), null);
  assert.ok(reverseIndex('iso').some((r) => r.ref === 'A.8.13'));
});

test('mappings resolve for a known control and fail softly otherwise', () => {
  const m = mappingsFor('PR-1.2');
  assert.ok(m.cis.includes('7.1'));
  assert.ok(m.csf.includes('ID.RA-01'));
  assert.ok(m.iso.includes('A.8.8'));
  assert.equal(mappingsFor('NOPE'), null);
});

test('coverage summary marks which mappings the Annex actually names', () => {
  const c = coverageSummary();
  assert.equal(c.csf.official, true);
  assert.equal(c.cis.official, true);
  assert.equal(c.iso.official, false);
  assert.ok(c.cis.distinctReferences > 50);
});

/* ------------------------------------------------------------ reports */

test('the HTML report is self contained and complete', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const html = renderReport(doc, { today: new Date('2026-09-03T00:00:00Z') });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(!/<script/i.test(html), 'the report must not carry script');
  assert.ok(!html.includes('undefined'), 'the report leaked an undefined value');
  assert.ok(!html.includes('[object Object]'));
  assert.ok(html.includes('Bayan Holding Group'));
  assert.ok(html.includes('Decision No. 2 of 2026'));
  for (const c of CONTROLS) assert.ok(html.includes(`>${c.id}<`), `${c.id} missing from the report`);
});

test('report output escapes anything an entity types', () => {
  const doc = build();
  doc.entity.name = '<img src=x onerror="alert(1)">';
  doc.controls['GOV-1'].notes = '</style><script>alert(2)</script>';
  const html = renderReport(doc);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>alert(2)'));
  assert.ok(html.includes('&lt;img src=x'));
});

test('markdown and CSV exports carry the same numbers', () => {
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  const r = assess(doc);
  const md = renderMarkdown(doc);
  assert.ok(md.includes(`| Implementation | ${r.scores.implementation}% |`));
  assert.ok(md.startsWith('# Bayan Holding Group'));

  const csv = renderCSV(doc);
  const lines = csv.trim().split('\n');
  assert.equal(lines[0].split(',')[0], 'control');
  assert.equal(lines.length - 1, r.scores.controls === 0 ? 0 : CATALOG_STATS.checks);
  assert.ok(csv.includes('GOV-1'));
});

test('CSV quotes any field containing a comma', () => {
  const csv = renderCSV(build());
  for (const line of csv.trim().split('\n')) {
    const bare = line.replace(/"(?:[^"]|"")*"/g, '');
    assert.equal(bare.split(',').length, 13, `unbalanced CSV row: ${line.slice(0, 70)}`);
  }
});

/* --------------------------------------------------------------- diff */

test('diff reports improvement, regression and band movement', () => {
  const before = build({ 'DE-2': allChecks('DE-2', 'gap'), 'GOV-1': allChecks('GOV-1', 'met') });
  const after = build({ 'DE-2': allChecks('DE-2', 'met'), 'GOV-1': allChecks('GOV-1', 'gap') });
  after.assessmentDate = '2027-09-01';
  const d = diffAssessments(before, after);
  assert.equal(d.improvements.find((c) => c.id === 'DE-2').direction, 'improved');
  assert.equal(d.regressions.find((c) => c.id === 'GOV-1').direction, 'regressed');
  assert.equal(d.summary.improved, 1);
  assert.equal(d.summary.regressed, 1);
  assert.equal(d.before.date, '2026-09-01');
  assert.equal(d.after.date, '2027-09-01');
});

test('an unchanged assessment produces no diff noise', () => {
  const doc = build({ 'DE-2': allChecks('DE-2', 'met') });
  const d = diffAssessments(doc, doc);
  assert.equal(d.changes.length, 0);
  assert.equal(d.summary.implementationDelta, 0);
});

test('diff records which individual checks moved', () => {
  const before = build({ 'DE-2': allChecks('DE-2', 'gap') });
  const after = build({ 'DE-2': { checks: ['met', 'gap', 'gap', 'gap', 'gap'], owner: 'x' } });
  const change = diffAssessments(before, after).changes.find((c) => c.id === 'DE-2');
  assert.equal(change.checkChanges.length, 1);
  assert.equal(change.checkChanges[0].from, 'gap');
  assert.equal(change.checkChanges[0].to, 'met');
});

/* ---------------------------------------------------------- shipped site */

test('the shipped page is in step with the catalog', () => {
  const built = buildSite();
  const shipped = readFileSync(resolve(root, 'docs/index.html'), 'utf8');
  assert.equal(
    built,
    shipped,
    'docs/index.html is stale. Run node scripts/build-site.mjs and commit the result.'
  );
});

test('the site payload carries every control and mapping', () => {
  const p = buildPayload();
  assert.equal(p.controls.length, 44);
  assert.equal(Object.keys(p.iso).length, 44);
  assert.equal(p.phases.length, 3);
  assert.equal(p.regulation.deadline, '2027-10-05');
  for (const c of p.controls) {
    assert.ok(c.requirement && c.checks.length && c.evidence.length);
  }
});

test('the injected payload cannot break out of its script tag', () => {
  const html = buildSite();
  const tag = '<script type="application/json" id="nbcc-data">';
  const start = html.indexOf(tag);
  assert.ok(start > 0, 'the data script tag is missing');
  const body = html.slice(start + tag.length, html.indexOf('</script>', start));
  assert.doesNotThrow(() => JSON.parse(body));
  assert.ok(!/<\/script/i.test(body));
});

test('the example assessment shipped in templates still scores', () => {
  assert.ok(existsSync(EXAMPLE));
  const doc = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
  assert.deepEqual(validateAssessment(doc), []);
  const r = assess(doc);
  assert.ok(r.scores.implementation > 0 && r.scores.implementation < 100);
  assert.ok(r.findings.length > 0, 'the example should demonstrate findings');
});

/* -------------------------------------------------------------- README */

test('the control table in the README matches the catalog', () => {
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
  const names = { GOV:'Govern', ID:'Identify', PR:'Protect', DE:'Detect',
                  RS:'Respond', RC:'Recover', CLD:'Cloud, Appendix A' };
  for (const [fn, label] of Object.entries(names)) {
    const rows = CONTROLS.filter((c) => c.fn === fn);
    const checks = rows.reduce((n, c) => n + c.checks.length, 0);
    assert.ok(
      readme.includes(`| ${label} | ${rows.length} | ${checks} |`),
      `README row for ${label} should read ${rows.length} controls and ${checks} checks`
    );
  }
  assert.ok(readme.includes(`| **Total** | **44** | **${CATALOG_STATS.checks}** |`));
  assert.ok(readme.includes(`**${CATALOG_STATS.checks} checks**`));
  assert.ok(readme.includes(`**${CATALOG_STATS.evidenceItems} evidence artifacts**`));
});

test('the README quotes the deadline the Decision actually sets', () => {
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
  assert.ok(readme.includes(REGULATION.deadline));
  assert.ok(readme.includes(String(REGULATION.complianceWindowMonths) + ' month window'));
});

/* ----------------------------------------------------------------- CLI */

test('the reported version is the one the manifest declares', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  assert.equal(cli(['version']).trim(), pkg.version);
  assert.ok(cli(['help']).includes(`v${pkg.version}`));
});

test('cli reports its version and help without a file', () => {
  assert.match(cli(['version']), /^\d+\.\d+\.\d+/);
  const help = cli(['help']);
  assert.ok(help.includes('Kuwait NBCC Toolkit'));
  assert.ok(help.includes('crosswalk'));
});

test('cli doctor passes on the shipped catalog', () => {
  const out = cli(['doctor']);
  assert.ok(out.includes('Catalog is internally consistent'));
  assert.ok(out.includes('44'));
});

test('cli assess prints scores for the example', () => {
  const out = cli(['assess', EXAMPLE]);
  assert.ok(out.includes('Bayan Holding Group'));
  assert.ok(out.includes('Implementation'));
  assert.ok(out.includes('Findings'));
});

test('cli show prints the official requirement', () => {
  const out = cli(['show', 'CLD-14']);
  assert.ok(out.includes('block public access by default'));
  assert.ok(out.includes('ISO 27001:2022'));
});

test('cli emits valid JSON for every machine readable command', () => {
  for (const args of [['catalog', '--json'], ['crosswalk', '--json'], ['deadline', '--json'],
                      ['assess', EXAMPLE, '--json'], ['plan', EXAMPLE, '--json'], ['evidence', EXAMPLE, '--json']]) {
    assert.doesNotThrow(() => JSON.parse(cli(args)), `${args.join(' ')} did not produce JSON`);
  }
});

test('cli init writes a scaffold that assess can read', () => {
  const json = cli(['init', '--stdout', '--no-cloud']);
  const doc = JSON.parse(json);
  assert.equal(Object.keys(doc.controls).length, 28);
  assert.deepEqual(validateAssessment(doc), []);
});

test('cli fails clearly on an unknown control and an unknown command', () => {
  for (const args of [['show', 'ZZ-9'], ['nonsense']]) {
    assert.throws(() => cli(args), (e) => /error/.test(String(e.stderr)));
  }
});

test('cli filters the catalog by function and phase', () => {
  const cloud = JSON.parse(cli(['catalog', '--json', '--fn', 'CLD']));
  assert.equal(cloud.length, 16);
  const phase1 = JSON.parse(cli(['catalog', '--json', '--phase', '1']));
  assert.ok(phase1.every((c) => c.phase === 1));
});
