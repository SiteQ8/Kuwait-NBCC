import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
