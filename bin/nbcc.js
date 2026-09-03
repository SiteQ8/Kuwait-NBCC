#!/usr/bin/env node
// Kuwait NBCC Toolkit. National Basic Cybersecurity Controls, Decision No. 2 of 2026.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import {
  REGULATION,
  FUNCTIONS,
  CONTROLS,
  CATALOG_STATS,
  PROFILE_FLAGS,
  getControl,
  getFunction,
  searchControls,
  applicableControls,
  validateCatalog
} from '../src/catalog.js';
import { assess, scaffold, validateAssessment, STATUSES } from '../src/assess.js';
import { buildPlan, deadlineStatus, evidencePack, milestones } from '../src/plan.js';
import { crosswalkTable, reverseIndex, mappingsFor, coverageSummary, FRAMEWORKS } from '../src/crosswalk.js';
import { renderReport, renderMarkdown, renderCSV } from '../src/report.js';
import { diffAssessments } from '../src/diff.js';
import { evidenceRegister, unevidencedClaims, renderRegisterCSV } from '../src/evidence.js';
import { forecast } from '../src/trend.js';
import { rollUp, renderPortfolioCSV, SYSTEMIC_SHARE } from '../src/portfolio.js';
import { MESSAGES } from '../src/messages.js';

// Language is chosen once from the flags and every printed string comes from
// the message table, so a command cannot half switch.
let M = MESSAGES.en;
function m(key, ...args) {
  const v = M[key] !== undefined ? M[key] : MESSAGES.en[key];
  if (v === undefined) return key;
  return typeof v === 'function' ? v(...args) : v;
}
const arabic = () => M.dir === 'rtl';
// Control text that exists in both languages.
const cl = (c, field) => (arabic() && c[`${field}Ar`] ? c[`${field}Ar`] : c[field]);

// Read from the manifest so the reported version can never drift from the
// package that was actually published.
const VERSION = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
).version;

// Piping to head or less closes stdout early. That is normal shell behaviour,
// not an error worth a stack trace.
process.stdout.on('error', (err) => {
  if (err && err.code === 'EPIPE') process.exit(0);
  throw err;
});
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const C = {
  reset: useColor ? '\u001b[0m' : '',
  bold: useColor ? '\u001b[1m' : '',
  dim: useColor ? '\u001b[2m' : '',
  green: useColor ? '\u001b[32m' : '',
  red: useColor ? '\u001b[31m' : '',
  yellow: useColor ? '\u001b[33m' : '',
  blue: useColor ? '\u001b[34m' : '',
  cyan: useColor ? '\u001b[36m' : ''
};

function out(s = '') {
  process.stdout.write(s + '\n');
}
// For generated documents, which carry their own trailing newline.
function emit(body) {
  process.stdout.write(body.endsWith('\n') ? body : `${body}\n`);
}
function writeOut(path, body) {
  writeFileSync(resolve(process.cwd(), String(path)), body.endsWith('\n') ? body : `${body}\n`, 'utf8');
}
function fail(message) {
  process.stderr.write(`${C.red}error${C.reset} ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          flags[a.slice(2)] = next;
          i += 1;
        } else {
          flags[a.slice(2)] = true;
        }
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function readJSON(path) {
  const full = resolve(process.cwd(), path);
  if (!existsSync(full)) fail(`file not found: ${path}`);
  try {
    return JSON.parse(readFileSync(full, 'utf8'));
  } catch (e) {
    return fail(`could not parse ${path} as JSON. ${e.message}`);
  }
}

function loadAssessment(path, options = {}) {
  if (!path) fail('an assessment file is required. Run "nbcc init" to create one.');
  const data = readJSON(path);
  const problems = validateAssessment(data);
  // A trend reads many files at once, so it summarises rather than repeating
  // the same warning block for each of them.
  if (problems.length && !options.quiet) {
    process.stderr.write(`${C.yellow}warning${C.reset} the assessment file has ${problems.length} issue(s):\n`);
    for (const p of problems.slice(0, 12)) process.stderr.write(`  ${p}\n`);
    if (problems.length > 12) process.stderr.write(`  and ${problems.length - 12} more\n`);
    process.stderr.write('\n');
  } else if (problems.length) {
    process.stderr.write(`${C.yellow}warning${C.reset} ${path} has ${problems.length} validation issue(s)\n`);
  }
  return data;
}

function bar(percent, width = 26) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const filled = Math.round((p / 100) * width);
  const color = p >= 95 ? C.green : p >= 75 ? C.blue : p >= 50 ? C.yellow : C.red;
  return `${color}${'\u2588'.repeat(filled)}${C.dim}${'\u2591'.repeat(width - filled)}${C.reset}`;
}

function pad(s, n) {
  const str = String(s);
  return str.length >= n ? str.slice(0, n) : str + ' '.repeat(n - str.length);
}
function padStart(s, n) {
  const str = String(s);
  return str.length >= n ? str : ' '.repeat(n - str.length) + str;
}

const STATE_WORDS = {
  en: { met: 'met', partial: 'partial', gap: 'gap', 'covered-by-exception': 'covered by exception',
        unassessed: 'unassessed', 'not-applicable': 'not applicable', 'out-of-scope': 'out of scope' },
  ar: { met: 'مستوف', partial: 'جزئي', gap: 'فجوة', 'covered-by-exception': 'مغطى باستثناء',
        unassessed: 'غير مقيم', 'not-applicable': 'لا ينطبق', 'out-of-scope': 'خارج النطاق' }
};
const STATE_WORD = (state) => (arabic() ? STATE_WORDS.ar : STATE_WORDS.en)[state] || state;

const STATE_COLOR = {
  met: C.green,
  partial: C.yellow,
  gap: C.red,
  'covered-by-exception': C.blue,
  unassessed: C.dim,
  'not-applicable': C.dim,
  'out-of-scope': C.dim
};

function help() {
  out(`${C.bold}Kuwait NBCC Toolkit${C.reset} ${C.dim}v${VERSION}${C.reset}\n${C.dim}National Basic Cybersecurity Controls, NCSC Decision No. 2 of 2026${C.reset}

  ${REGULATION.decision}, ${REGULATION.title}
  Issued by the ${REGULATION.authority}. Full compliance due ${REGULATION.deadline}.

${C.bold}Usage${C.reset}
  nbcc <command> [options]

${C.bold}Understand the baseline${C.reset}
  catalog                     List all ${CATALOG_STATS.controls} controls
  show <id> [--ar]            Full detail of one control, for example: nbcc show PR-2
  search <term>               Find controls whose text matches a term
  crosswalk [--to csf|cis|iso]  Map the baseline onto other frameworks
  deadline                    Where today sits in the 18 month window

${C.bold}Measure an entity${C.reset}
  init [--out file]           Create a starter assessment file
  assess <file>               Score an assessment and list gaps
  plan <file>                 Sequenced readiness plan to the deadline
  evidence <file>             Evidence register: what is held, where, how old
  diff <before> <after>       Posture change between two assessments
  trend <file...>             Project a series of assessments at the deadline
  portfolio <file...>         Roll several entities up and separate systemic gaps

${C.bold}Produce a record${C.reset}
  report <file> [--out f]     Self contained HTML report
  export <file> --as md|csv|json|register
                              register exports the evidence register as CSV

${C.bold}Options${C.reset}
  --ar                        Print everything in Arabic
  --csv                       Export the evidence register as CSV
  --missing, --stale          Narrow the evidence register to one state
  --fn GOV|ID|PR|DE|RS|RC|CLD   Filter by function
  --phase 1|2|3                 Filter by readiness phase
  --gaps                        Show only controls that are not met
  --json                        Machine readable output
  --no-cloud                    Scaffold without the Appendix A cloud controls
  --out <file>                  Write output to a file
  --date YYYY-MM-DD             Treat this as today for deadline maths

${C.dim}Assessment data stays on your machine. Nothing is uploaded.${C.reset}`);
}

function cmdCatalog(flags) {
  const list = CONTROLS.filter((c) => {
    if (flags.fn && c.fn !== String(flags.fn).toUpperCase()) return false;
    if (flags.phase && c.phase !== Number(flags.phase)) return false;
    return true;
  });
  if (flags.json) return out(JSON.stringify(list, null, 2));

  const ar = Boolean(flags.ar);
  out(`${C.bold}${ar ? REGULATION.titleAr : REGULATION.title}${C.reset}  ${C.dim}${ar ? REGULATION.decisionAr : REGULATION.decision}${C.reset}`);
  out(`${C.dim}${ar ? `${list.length} ضابطا و${list.reduce((n, c) => n + c.checks.length, 0)} بندا للتحقق`
    : `${list.length} controls, ${list.reduce((n, c) => n + c.checks.length, 0)} checks`}${C.reset}\n`);
  let current = null;
  for (const c of list) {
    if (c.fn !== current) {
      current = c.fn;
      const fn = getFunction(c.fn);
      out(`${C.bold}${C.cyan}${ar ? fn.nameAr : fn.name}${C.reset} ${C.dim}${ar ? fn.blurbAr : fn.blurb}${C.reset}`);
    }
    out(
      `  ${C.bold}${pad(c.id, 9)}${C.reset} ${pad(ar ? c.titleAr : c.title, 46)} ${C.dim}${padStart(c.checks.length, 3)}${ar ? ' بندا' : ' checks'}  ${ar ? 'مرحلة' : 'phase'} ${c.phase}${C.reset}`
    );
  }
  out(`\n${C.dim}${ar ? 'استخدم "nbcc show <id> --ar" لعرض الحد الأدنى المطلوب.' : 'Run "nbcc show <id>" for the official minimum requirement.'}${C.reset}`);
}

function cmdShow(positional, flags) {
  const id = positional[0];
  if (!id) fail('a control id is required, for example: nbcc show GOV-1');
  const c = getControl(id);
  if (!c) fail(`unknown control "${id}". Run "nbcc catalog" to list them.`);
  if (flags.json) return out(JSON.stringify({ ...c, mappings: mappingsFor(c.id) }, null, 2));

  const fn = getFunction(c.fn);
  const ar = Boolean(flags.ar);
  const CADENCE_AR = { annual:'سنويا', biennial:'كل سنتين', 'per hire':'عند كل تعيين', weekly:'أسبوعيا',
    monthly:'شهريا', quarterly:'ربع سنوي', continuous:'مستمر', 'per incident':'عند كل حادث',
    'per engagement':'عند كل تعاقد' };
  const EFFORT_AR = { low:'منخفض', medium:'متوسط', high:'مرتفع' };

  out(`${C.bold}${c.id}${C.reset}  ${C.bold}${ar ? c.titleAr : c.title}${C.reset}`);
  out(`${C.dim}${ar ? `${fn.nameAr} \u00b7 المرحلة ${c.phase} \u00b7 الجهد ${EFFORT_AR[c.effort] || c.effort} \u00b7 ${CADENCE_AR[c.cadence] || c.cadence}`
    : `${fn.name} \u00b7 phase ${c.phase} \u00b7 ${c.effort} effort \u00b7 ${c.cadence}`}${C.reset}\n`);
  out(`${C.cyan}${ar ? 'الغرض' : 'Purpose'}${C.reset}`);
  const editorialNote = c.purposeSource === 'editorial'
    ? `  ${C.dim}${ar ? '(تلخيص، وليس من نص الملحق)' : '(summary, not Annex text)'}${C.reset}` : '';
  out(`  ${ar ? c.purposeAr : c.purpose}${editorialNote}\n`);
  // Article 6 keeps the English Annex authoritative, so the Arabic is offered
  // as a working translation and the official wording is printed after it.
  out(`${C.cyan}${ar ? 'الحد الأدنى المطلوب' : 'Minimum requirement'}${C.reset}  ${C.dim}${ar ? '(ترجمة عاملة)' : '(official text)'}${C.reset}`);
  // The Annex uses bullets inside some requirements and they carry meaning,
  // so each one keeps its own hanging indent rather than running together.
  const printRequirement = (text) => {
    for (const para of text.split('\n')) {
      const bullet = para.startsWith('\u2022');
      const body = bullet ? para.slice(1).trim() : para;
      const lines = wrap(body, bullet ? 72 : 76);
      lines.forEach((line, i) => out(bullet ? `    ${i === 0 ? '\u2022 ' : '  '}${line}` : `  ${line}`));
    }
  };
  printRequirement(ar ? c.requirementAr : c.requirement);
  if (ar) {
    out('');
    out(`${C.cyan}النص الرسمي بالإنجليزية${C.reset}`);
    printRequirement(c.requirement);
  }
  out('');
  out(`${C.cyan}${ar ? 'بنود التحقق' : 'Checks'}${C.reset} ${C.dim}(${c.checks.length})${C.reset}`);
  (ar ? c.checksAr : c.checks).forEach((t, i) => {
    const lines = wrap(t, 72);
    out(`  ${C.dim}${padStart(i + 1, 2)}${C.reset}  ${lines[0]}`);
    for (const l of lines.slice(1)) out(`      ${l}`);
  });
  out('');
  out(`${C.cyan}${ar ? 'الأدلة الواجب حفظها' : 'Evidence to retain'}${C.reset}`);
  for (const e of (ar ? c.evidenceAr : c.evidence)) out(`  \u00b7 ${e}`);
  const m = mappingsFor(c.id);
  out('');
  out(`${C.cyan}${ar ? 'المواءمة مع الأطر' : 'Maps to'}${C.reset}`);
  out(`  NIST CSF 2.0    ${m.csf.join(', ')}`);
  out(`  CIS v8.1 IG1    ${m.cis.join(', ')}`);
  out(`  ISO 27001:2022  ${m.iso.join(', ')}`);
  if (c.appliesWhen.length) {
    out('');
    out(`${C.dim}Applies only when: ${c.appliesWhen.join(', ')}${C.reset}`);
  }
}

function wrap(text, width) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function cmdSearch(positional, flags) {
  const term = positional.join(' ');
  if (!term) fail('a search term is required.');
  const hits = searchControls(term);
  if (flags.json) return out(JSON.stringify(hits.map((h) => h.id), null, 2));
  if (!hits.length) return out(m('searchNone', term));
  out(`${m('searchFound', hits.length, term)}\n`);
  for (const c of hits) {
    const lower = term.toLowerCase();
    // A term matched in one language should still be shown in the chosen one,
    // so the matching check is located by index rather than by string.
    let idx = cl(c, 'checks').findIndex((k) => k.toLowerCase().includes(lower));
    if (idx < 0) idx = c.checks.findIndex((k) => k.toLowerCase().includes(lower));
    out(`  ${C.bold}${pad(c.id, 9)}${C.reset} ${cl(c, 'title')}`);
    if (idx >= 0) out(`  ${' '.repeat(9)} ${C.dim}${wrap(cl(c, 'checks')[idx], 66)[0]}${C.reset}`);
  }
}

function cmdDeadline(flags) {
  const today = flags.date ? new Date(flags.date) : new Date();
  const s = deadlineStatus(today);
  if (flags.json) return out(JSON.stringify(s, null, 2));

  out(`${C.bold}${arabic() ? REGULATION.decisionAr : REGULATION.decision}${C.reset} ${C.dim}${arabic() ? REGULATION.titleAr : REGULATION.title}${C.reset}`);
  out(`${C.dim}${m('publishedIn', s.publishedOn, arabic() ? REGULATION.gazetteAr : REGULATION.gazette)}${C.reset}\n`);
  out(`  ${C.bold}${s.overdue ? C.red + m('deadlineOver', Math.abs(s.remainingDays), s.deadline)
    : m('deadlineRemain', s.remainingDays, s.deadline)}${C.reset}`);
  out(`  ${bar(s.elapsedPercent, 40)} ${m('deadlineElapsed', s.elapsedPercent)}\n`);
  out(`${C.cyan}${m('milestonesHead')}${C.reset}`);
  for (const stone of s.milestones) {
    const mark = stone.passed
      ? `${C.red}${arabic() ? 'انقضت' : 'passed'}${C.reset}`
      : `${C.green}${stone.daysRemaining} ${m('days')}${C.reset}`;
    out(`  ${stone.passed ? '\u25cf' : '\u25cb'} ${pad(arabic() ? stone.nameAr : stone.name, arabic() ? 16 : 12)} ${C.dim}${m('dueOn')}${C.reset} ${stone.due}  ${mark}`);
    for (const l of wrap(arabic() ? stone.blurbAr : stone.blurb, 66)) out(`    ${C.dim}${l}${C.reset}`);
  }
}

function cmdInit(flags) {
  const profile = {};
  for (const f of PROFILE_FLAGS) profile[f.key] = true;
  if (flags['no-cloud']) profile.usesCloud = false;
  if (flags['no-social']) profile.hasPublicAccounts = false;

  const doc = scaffold({
    profile,
    entityName: typeof flags.entity === 'string' ? flags.entity : '',
    assessor: typeof flags.assessor === 'string' ? flags.assessor : '',
    date: typeof flags.date === 'string' ? flags.date : undefined
  });
  const path = typeof flags.out === 'string' ? flags.out : 'nbcc-assessment.json';
  const json = JSON.stringify(doc, null, 2);
  if (flags.stdout) return out(json);
  writeFileSync(resolve(process.cwd(), path), json + '\n', 'utf8');
  const n = Object.keys(doc.controls).length;
  const checks = applicableControls(profile).reduce((a, c) => a + c.checks.length, 0);
  out(`${C.green}Created${C.reset} ${path}`);
  out(`  ${n} applicable controls, ${checks} checks to answer.`);
  out(`  Statuses: ${STATUSES.join(', ')}.`);
  out(`\n${C.dim}Fill in the checks, then run "nbcc assess ${path}".${C.reset}`);
}

function cmdAssess(positional, flags) {
  const data = loadAssessment(positional[0]);
  const asOf = flags.date ? new Date(`${flags.date}T00:00:00Z`) : new Date();
  const r = assess(data, { asOf });
  if (flags.json) return out(JSON.stringify(r, null, 2));

  const s = r.scores;
  const W = arabic() ? 22 : 20;
  out(`${C.bold}${r.entity.name || m('notRecorded')}${C.reset} ${C.dim}${m('assessedOn', '', r.assessmentDate).trim()}${C.reset}\n`);
  out(`  ${pad(m('implementation'), W)}${bar(s.implementation)} ${padStart(s.implementation + '%', 6)}`);
  out(`  ${pad(m('posture'), W)}${bar(s.posture)} ${padStart(s.posture + '%', 6)}`);
  out(`  ${pad(m('coverage'), W)}${bar(s.coverage)} ${padStart(s.coverage + '%', 6)}`);
  out(`\n  ${m('band')} ${C.bold}${arabic() ? s.band.labelAr : s.band.label}${C.reset}   ` +
      m('scoreLine', s.controlsMet, s.controlsPartial, `${C.red}${s.controlsGap}${C.reset}`, s.controlsUnassessed, s.controlsExcepted));
  out(`  ${m('scopeLine', s.controlsInScope, s.controlsOutOfScope, s.scoredChecks)}\n`);

  out(`${C.cyan}${m('byFunction')}${C.reset}`);
  for (const f of r.byFunction) {
    out(`  ${pad(arabic() ? f.nameAr : f.name, arabic() ? 18 : 10)} ${bar(f.implementation, 22)} ${padStart(f.implementation + '%', 6)}  ${C.dim}${f.met}/${f.controls} ${m('metShort')}${C.reset}`);
  }

  const rows = r.controls.filter((c) => c.inScope && (!flags.gaps || c.state !== 'met'));
  const filtered = rows.filter((c) => {
    if (flags.fn && c.fn !== String(flags.fn).toUpperCase()) return false;
    if (flags.phase && c.phase !== Number(flags.phase)) return false;
    return true;
  });
  out(`\n${C.cyan}${m('controlsHead')}${C.reset}`);
  for (const c of filtered) {
    const col = STATE_COLOR[c.state] || '';
    out(
      `  ${C.bold}${pad(c.id, 9)}${C.reset} ${pad(arabic() ? c.titleAr : c.title, 44)} ${col}${pad(STATE_WORD(c.state), 20)}${C.reset} ${padStart(c.implementation === null ? '' : c.implementation + '%', 6)}`
    );
  }

  if (r.findings.length) {
    out(`\n${C.cyan}${m('findingsHead')}${C.reset} ${C.dim}(${r.findings.length})${C.reset}`);
    for (const f of r.findings.slice(0, 12)) {
      const col = f.severity === 'high' ? C.red : f.severity === 'medium' ? C.yellow : C.dim;
      out(`  ${col}${pad(m('severities')[f.severity] || f.severity, 9)}${C.reset} ${pad(f.control, 9)} ${arabic() && f.issueAr ? f.issueAr : f.issue}`);
    }
    if (r.findings.length > 12) out(`  ${C.dim}${m('findingsMore', r.findings.length - 12)}${C.reset}`);
  }

  // A score with nothing behind it is the gap an audit finds first, so the
  // headline output says how much of this position can actually be shown.
  const reg = evidenceRegister(data, asOf);
  const claims = unevidencedClaims(data, r, asOf);
  out(`\n${C.cyan}${m('evidenceHeadShort')}${C.reset}`);
  out(`  ${m('evidenceLocatable', padStart(`${reg.producible}%`, 6), reg.totalArtifacts)}`);
  if (claims.length > 0) {
    out(`  ${C.yellow}${padStart(String(claims.length), 6)}${C.reset} ${m('evidenceClaims')}`);
  }
  out(`  ${C.dim}${m('evidenceHint', positional[0])}${C.reset}`);
}

function cmdPlan(positional, flags) {
  const data = loadAssessment(positional[0]);
  const p = buildPlan(data, flags.date ? new Date(flags.date) : new Date());
  if (flags.json) return out(JSON.stringify(p, null, 2));

  out(`${C.bold}${m('planHead')}${C.reset} ${C.dim}${p.entity.name || m('notRecorded')}${C.reset}\n`);
  const d = p.deadline;
  out(`  ${bar(d.elapsedPercent, 40)} ${d.remainingDays} ${m('days')} ${m('dueOn')} ${d.deadline}`);
  out(`  ${m('planEffort', p.effort.totalPersonDays, p.effort.workingDaysRemaining)}`);

  for (const phase of p.phases) {
    out(`\n${C.cyan}${m('phase')} ${phase.id}: ${arabic() ? phase.nameAr : phase.name}${C.reset} ` +
        `${C.dim}${m('dueOn')} ${phase.due}, ${phase.passed ? (arabic() ? 'انقضت' : 'passed') : phase.daysRemaining + ' ' + m('days')}${C.reset}`);
    for (const l of wrap(arabic() ? phase.blurbAr : phase.blurb, 74)) out(`  ${C.dim}${l}${C.reset}`);
    if (!phase.items.length) {
      out(`  ${C.green}${m('planNoWork')}${C.reset}`);
      continue;
    }
    out(`  ${C.dim}${phase.openControls} ${m('planOpen')}, ${phase.estimatedPersonDays} ${m('days')}${C.reset}`);
    for (const item of phase.items) {
      const wait = item.waitingOn.length ? ` ${C.dim}${m('planWaits')} ${item.waitingOn.join(',')}${C.reset}` : '';
      const unb = item.unblocks.length ? ` ${C.yellow}${m('planUnblocks')} ${item.unblocks.length}${C.reset}` : '';
      out(`    ${pad(item.id, 9)} ${pad(arabic() ? item.titleAr || item.title : item.title, 42)} ${C.dim}${pad(m('efforts')[item.effort] || item.effort, 9)}${C.reset}${unb}${wait}`);
    }
  }

  if (p.quickWins.length) {
    out(`\n${C.cyan}${arabic() ? 'ابدأ من هنا' : 'Start here'}${C.reset} ${C.dim}${arabic() ? 'جهد منخفض ومفتوح الآن' : 'low effort, open now'}${C.reset}`);
    for (const q of p.quickWins) out(`  ${pad(q.id, 9)} ${arabic() ? q.titleAr || q.title : q.title}`);
  }
}

function cmdEvidence(positional, flags) {
  const data = loadAssessment(positional[0]);
  const asOf = flags.date ? new Date(`${flags.date}T00:00:00Z`) : new Date();
  const reg = evidenceRegister(data, asOf);

  if (flags.csv) return emit(renderRegisterCSV(data, asOf));
  if (flags.json) return out(JSON.stringify(reg, null, 2));

  const MARK = {
    held: `${C.green}\u25a0${C.reset}`,
    unreferenced: `${C.yellow}\u25a0${C.reset}`,
    stale: `${C.yellow}\u25a3${C.reset}`,
    undated: `${C.yellow}\u25a3${C.reset}`,
    misdated: `${C.red}\u25a3${C.reset}`,
    missing: `${C.dim}\u25a1${C.reset}`
  };

  const RW = arabic() ? 14 : 12;
  out(`${C.bold}${m('registerHead')}${C.reset} ${C.dim}${reg.entity}${C.reset}`);
  out(`${C.dim}${m('registerSub', reg.totalArtifacts, reg.retentionYears)}${C.reset}\n`);

  out(`  ${pad(m('regRecorded'), RW)}${bar(reg.coverage)}  ${padStart(`${reg.coverage}%`, 6)}`);
  out(`  ${pad(m('regProducible'), RW)}${bar(reg.producible)}  ${padStart(`${reg.producible}%`, 6)}`);
  const c = reg.counts;
  out(`\n  ${m('regCounts', `${C.green}${c.held}${C.reset}`, `${C.yellow}${c.unreferenced}${C.reset}`,
      `${C.yellow}${c.stale}${C.reset}`, `${C.yellow}${c.undated}${C.reset}`, `${C.dim}${c.missing}${C.reset}`)}`);
  if (reg.oldestCollected) {
    out(`  ${C.dim}${m('regRange', reg.oldestCollected, reg.newestCollected)}${C.reset}`);
  }

  const only = flags.missing ? 'missing' : flags.stale ? 'stale' : null;
  out('');
  for (const [id, items] of Object.entries(reg.byControl)) {
    if (flags.fn && items[0].fn !== String(flags.fn).toUpperCase()) continue;
    const shown = only ? items.filter((i) => i.state === only) : items;
    if (shown.length === 0) continue;
    const usable = items.filter((i) => i.state === 'held' || i.state === 'unreferenced').length;
    out(`${C.bold}${id}${C.reset} ${arabic() ? items[0].controlTitleAr : items[0].controlTitle} ${C.dim}${usable}/${items.length} \u00b7 ${m('cadences')[items[0].cadence] || items[0].cadence}${C.reset}`);
    for (const i of shown) {
      const detail = i.state === 'missing' ? ''
        : i.state === 'unreferenced' ? `${C.dim} ${m('regNoLocation')}${C.reset}`
        : i.state === 'undated' ? `${C.dim} ${m('regNoDate')}${C.reset}`
        : `${C.dim} ${i.reference || m('regNoRef')}${i.collected ? `, ${i.collected}` : ''}` +
          `${i.state === 'stale' ? `, ${m('regOld', i.ageDays)}` : ''}${C.reset}`;
      out(`  ${MARK[i.state]} ${arabic() ? i.artifactAr : i.artifact}${detail}`);
    }
  }

  if (reg.findings.length > 0 && !only) {
    const high = reg.findings.filter((f) => f.severity === 'medium');
    if (high.length > 0) {
      out(`\n${C.bold}${m('regAttention')}${C.reset}`);
      for (const f of high.slice(0, 10)) {
        out(`  ${C.yellow}${pad(f.control, 9)}${C.reset} ${arabic() && f.issueAr ? f.issueAr : f.issue}`);
      }
      if (high.length > 10) out(`  ${C.dim}${m('findingsMore', high.length - 10)}${C.reset}`);
    }
  }

  const claims = only ? [] : unevidencedClaims(data, assess(data, { asOf }), asOf);
  if (claims.length > 0) {
    out(`\n${C.bold}${m('regClaimsHead')}${C.reset} ${C.dim}(${claims.length})${C.reset}`);
    out(`${C.dim}${m('regClaimsSub')}${C.reset}`);
    for (const c2 of claims.slice(0, 10)) {
      const title = arabic() ? getControl(c2.control).titleAr : c2.title;
      out(`  ${C.yellow}${pad(c2.control, 9)}${C.reset} ${pad(title, 44)} ${C.dim}${c2.implementation}%${C.reset}`);
    }
    if (claims.length > 10) out(`  ${C.dim}${m('findingsMore', claims.length - 10)}${C.reset}`);
  }

  out(`\n${C.dim}${m('regHint')}${C.reset}`);
}

function cmdTrend(positional, flags) {
  if (positional.length < 2) {
    fail('at least two assessment files are required: nbcc trend q1.json q2.json q3.json');
  }
  const docs = positional.map((p) => loadAssessment(p, { quiet: true }));
  const asOf = flags.date ? new Date(`${flags.date}T00:00:00Z`) : new Date();
  const f = forecast(docs, { asOf });

  if (flags.json) return out(JSON.stringify(f, null, 2));
  if (!f.ok) {
    for (const r of f.rejected) out(`${C.yellow}skipped${C.reset} ${r.label}: ${r.reason}`);
    return fail(f.reason);
  }

  const VERDICT_COLOR = {
    'on track': C.green, close: C.yellow, behind: C.red,
    stalled: C.red, regressing: C.red, complete: C.green
  };

  out(`${C.bold}${m('trendHead')}${C.reset} ${C.dim}${f.entity}${C.reset}`);
  out(`${C.dim}${m('trendSub', f.snapshots, f.from, f.to, f.spanDays)}${C.reset}\n`);

  out(`${C.cyan}${m('trendSeries')}${C.reset}`);
  for (const p of f.points) {
    out(`  ${C.dim}${p.date}${C.reset}  ${bar(p.implementation, 20)} ${padStart(`${p.implementation}%`, 6)}` +
        `  ${C.dim}${pad(arabic() ? p.bandNameAr : p.bandName, arabic() ? 16 : 14)} ${m('evidenceHeadShort')} ${padStart(`${p.evidenceProducible}%`, 6)}${C.reset}`);
  }

  const i = f.implementation;
  const col = VERDICT_COLOR[i.verdict] || C.dim;
  const word = m('verdicts')[i.verdict] || i.verdict;
  out(`\n${C.cyan}${m('trendRate')}${C.reset}`);
  out(`  ${m('trendMoved', m('implementation'), i.changeTotal, i.perMonth)}`);
  if (Math.abs(f.recentRateDriftPercent) >= 25) {
    const dir = f.recentRateDriftPercent > 0 ? m('faster') : m('slower');
    out(`  ${C.yellow}${m('trendDrift', Math.abs(f.recentRateDriftPercent), dir, i.recentPerMonth)}${C.reset}`);
  }
  out(`  ${m('trendMoved', m('evidenceHeadShort'), f.evidence.changeTotal, f.evidence.perMonth)}`);

  out(`\n${C.cyan}${m('trendForecast')}${C.reset} ${C.dim}${m('trendForecastSub', f.deadline, f.daysToDeadline)}${C.reset}`);
  out(`  ${col}${C.bold}${word.toUpperCase()}${C.reset}`);
  if (i.verdict === 'on track' || i.verdict === 'complete') {
    out(`  ${m('trendReaches', `${C.green}${i.completionDate}${C.reset}`,
      Math.round((new Date(f.deadline) - new Date(i.completionDate)) / 86400000))}`);
  } else if (i.verdict === 'stalled' || i.verdict === 'regressing') {
    out(`  ${m('trendStalled', i.current, `${C.yellow}${i.neededPerMonth}${C.reset}`)}`);
  } else {
    out(`  ${m('trendShort', `${col}${i.projectedAtDeadline}${C.reset}`, `${col}${i.shortfall}${C.reset}`)}`);
    out(`  ${m('trendNeeded', i.perMonth, `${C.yellow}${i.neededPerMonth}${C.reset}`,
      Math.round((i.neededPerMonth / (i.perMonth || 0.01)) * 10) / 10)}`);
  }
  if (f.evidence.projectedAtDeadline < 100) {
    out(`  ${C.dim}${m('trendEvidence', f.evidence.projectedAtDeadline)}${C.reset}`);
  }

  out(`\n${C.cyan}${m('trendByFunction')}${C.reset} ${C.dim}${m('worstFirst')}${C.reset}`);
  for (const fn of f.byFunction) {
    const c2 = fn.projectedAtDeadline >= 100 ? C.green : fn.projectedAtDeadline >= 90 ? C.yellow : C.red;
    out(`  ${pad(arabic() ? fn.nameAr : fn.name, arabic() ? 18 : 10)} ${bar(fn.current, 18)} ${padStart(`${fn.current}%`, 6)} ${m('trendNow')}` +
        `  ${C.dim}${padStart(`${fn.perMonth > 0 ? '+' : ''}${fn.perMonth}`, 6)}${m('perMonth')}${C.reset}` +
        `  ${c2}${padStart(`${fn.projectedAtDeadline}%`, 6)}${C.reset} ${C.dim}${m('trendProjected')}${C.reset}`);
  }

  if (f.duplicates.length > 0) {
    out(`\n${C.yellow}warning${C.reset} ${m('trendDupes', f.duplicates.join(', '))}`);
  }
  for (const r of f.rejected) out(`${C.yellow}${m('trendSkipped')}${C.reset} ${r.label}: ${r.reason}`);
  out(`\n${C.dim}${m('trendCaveat')}${C.reset}`);
}

function cmdPortfolio(positional, flags) {
  if (positional.length < 2) {
    fail('at least two assessment files are required: nbcc portfolio a.json b.json');
  }
  const docs = positional.map((p) => loadAssessment(p, { quiet: true }));
  const asOf = flags.date ? new Date(`${flags.date}T00:00:00Z`) : new Date();

  if (flags.csv) return emit(renderPortfolioCSV(docs, { asOf }));
  const r = rollUp(docs, { asOf });
  if (flags.json) return out(JSON.stringify(r, null, 2));

  const PW = arabic() ? 20 : 22;
  out(`${C.bold}${m('portfolioHead')}${C.reset} ${C.dim}${m('portfolioSub', r.entities, r.daysToDeadline, r.deadline)}${C.reset}\n`);

  if (r.looksLikeSeries) {
    out(`${C.yellow}warning${C.reset} ${m('portfolioSeriesWarn')}`);
    out(`${C.dim}        ${m('portfolioSeriesHint')}${C.reset}\n`);
  }

  out(`  ${pad(m('meanImpl'), PW)}${bar(r.scores.meanImplementation)} ${padStart(`${r.scores.meanImplementation}%`, 6)}`);
  out(`  ${pad(m('meanEvidence'), PW)}${bar(r.scores.meanEvidence)} ${padStart(`${r.scores.meanEvidence}%`, 6)}`);
  out(`\n  ${C.dim}${m('portfolioRange', r.scores.lowest, r.scores.highest, r.scores.spread,
      r.scores.atBaseline, r.entities, r.scores.totalHighFindings, r.scores.totalUnevidencedClaims)}${C.reset}`);

  out(`\n${C.cyan}${m('entitiesHead')}${C.reset} ${C.dim}${m('mostExposed')}${C.reset}`);
  for (const e of r.ranked) {
    const col = e.implementation >= 95 ? C.green : e.implementation >= 75 ? C.blue
      : e.implementation >= 50 ? C.yellow : C.red;
    out(`  ${pad(e.name, 24)} ${bar(e.implementation, 18)} ${col}${padStart(`${e.implementation}%`, 6)}${C.reset}` +
        `  ${C.dim}${pad(arabic() ? e.bandNameAr : e.bandName, arabic() ? 15 : 13)} ${m('evidenceHeadShort')} ${padStart(`${e.evidenceProducible}%`, 6)}` +
        `  ${e.highFindings ? C.red : C.dim}${padStart(String(e.highFindings), 2)} ${m('highShort')}${C.reset}`);
  }

  if (r.systemic.length > 0) {
    out(`\n${C.cyan}${m('systemicHead')}${C.reset} ${C.dim}${m('systemicSub', Math.round(SYSTEMIC_SHARE * 100))}${C.reset}`);
    out(`${C.dim}${m('systemicNote')}${C.reset}`);
    for (const c of r.systemic.slice(0, 12)) {
      out(`  ${C.red}${pad(c.id, 9)}${C.reset} ${pad(arabic() ? c.titleAr : c.title, 42)} ${C.red}${padStart(`${c.entitiesFailing}/${c.entitiesApplicable}`, 6)}${C.reset}` +
          `  ${C.dim}${m('mean')} ${padStart(`${c.mean}%`, 6)} \u00b7 ${m('phase')} ${c.phase} \u00b7 ${m('efforts')[c.effort] || c.effort}${C.reset}`);
    }
    if (r.systemic.length > 12) out(`  ${C.dim}${m('findingsMore', r.systemic.length - 12)}${C.reset}`);
  } else {
    out(`\n${C.cyan}${m('systemicHead')}${C.reset}  ${C.green}${m('none')}${C.reset} ${C.dim}${m('systemicNone')}${C.reset}`);
  }

  if (r.isolated.length > 0 && !flags.systemic) {
    out(`\n${C.cyan}${m('isolatedHead')}${C.reset} ${C.dim}${m('isolatedSub')}${C.reset}`);
    for (const c of r.isolated.slice(0, 8)) {
      out(`  ${C.yellow}${pad(c.id, 9)}${C.reset} ${pad(arabic() ? c.titleAr : c.title, 42)} ${padStart(`${c.entitiesFailing}/${c.entitiesApplicable}`, 6)}` +
          `  ${C.dim}${c.failingNames.slice(0, 3).join(', ')}${c.failingNames.length > 3 ? ', ...' : ''}${C.reset}`);
    }
    if (r.isolated.length > 8) out(`  ${C.dim}${m('findingsMore', r.isolated.length - 8)}${C.reset}`);
  }

  out(`\n${C.cyan}${m('trendByFunction')}${C.reset} ${C.dim}${m('worstFirst')}${C.reset}`);
  for (const f of r.byFunction) {
    out(`  ${pad(arabic() ? f.nameAr : f.name, arabic() ? 18 : 10)} ${bar(f.mean, 20)} ${padStart(`${f.mean}%`, 6)} ${m('mean')}` +
        `  ${C.dim}${padStart(`${f.lowest}%`, 6)} ${m('of')} ${padStart(`${f.highest}%`, 6)}${C.reset}`);
  }

  if (r.duplicateNames.length > 0) {
    out(`\n${C.yellow}warning${C.reset} ${m('portfolioDupes', r.duplicateNames.join(', '))}`);
  }
  out(`\n${C.dim}${m('portfolioHint')}${C.reset}`);
}

function cmdCrosswalk(flags) {
  const to = flags.to ? String(flags.to).toLowerCase() : null;
  if (to && !FRAMEWORKS[to]) fail(`unknown framework "${to}". Use csf, cis or iso.`);

  if (to) {
    const index = reverseIndex(to);
    if (flags.json) return out(JSON.stringify(index, null, 2));
    const fw = FRAMEWORKS[to];
    out(`${C.bold}${fw.name}${C.reset} ${C.dim}${m('crosswalkTo')}${C.reset}`);
    out(`${C.dim}${fw.note}${C.reset}\n`);
    for (const row of index) out(`  ${pad(row.ref, 12)} ${row.controls.join(', ')}`);
    return;
  }

  const table = crosswalkTable();
  if (flags.json) return out(JSON.stringify(table, null, 2));
  const cov = coverageSummary();
  out(`${C.bold}${m('crosswalkHead')}${C.reset}\n`);
  for (const key of Object.keys(cov)) {
    const c = cov[key];
    out(`  ${pad(c.shortName, 22)} ${padStart(c.distinctReferences, 3)} ${m('crosswalkReferenced')} ${C.dim}${c.official ? m('crosswalkOfficial') : m('crosswalkConvenience')}${C.reset}`);
  }
  out('');
  out(`  ${C.dim}${pad(m('colControl'), 9)} ${pad('NIST CSF 2.0', 34)} ${pad('CIS v8.1', 30)} ISO 27001${C.reset}`);
  for (const r of table) {
    out(`  ${C.bold}${pad(r.control, 9)}${C.reset} ${pad(r.csf.join(' '), 34)} ${pad(r.cis.join(' '), 30)} ${r.iso.join(' ')}`);
  }
}

function cmdReport(positional, flags) {
  const data = loadAssessment(positional[0]);
  const html = renderReport(data, {
    today: flags.date ? new Date(`${flags.date}T00:00:00Z`) : new Date(),
    lang: flags.ar ? 'ar' : 'en'
  });
  const path = typeof flags.out === 'string' ? flags.out : 'nbcc-report.html';
  writeFileSync(resolve(process.cwd(), path), html, 'utf8');
  const r = assess(data);
  out(`${C.green}Wrote${C.reset} ${path} ${C.dim}(${Math.round(html.length / 1024)} KB)${C.reset}`);
  out(`  ${r.entity.name || 'Unnamed entity'} \u00b7 ${r.scores.implementation}% implementation \u00b7 ${r.scores.band.label}`);
  out(`  ${C.dim}Open it in a browser or print it to PDF. Nothing loads from the network except the web font.${C.reset}`);
}

function cmdExport(positional, flags) {
  const data = loadAssessment(positional[0]);
  const as = String(flags.as || 'md').toLowerCase();
  let body;
  let ext;
  if (as === 'md' || as === 'markdown') {
    body = renderMarkdown(data);
    ext = 'md';
  } else if (as === 'csv') {
    body = renderCSV(data);
    ext = 'csv';
  } else if (as === 'json') {
    body = JSON.stringify(assess(data), null, 2);
    ext = 'json';
  } else if (as === 'register') {
    body = renderRegisterCSV(data, flags.date ? new Date(`${flags.date}T00:00:00Z`) : new Date());
    ext = 'csv';
  } else {
    return fail(`unknown format "${as}". Use md, csv, json or register.`);
  }
  if (flags.out) {
    writeOut(flags.out, body);
    out(`${C.green}Wrote${C.reset} ${flags.out}`);
  } else {
    emit(body);
  }
  void ext;
}

function cmdDiff(positional, flags) {
  if (positional.length < 2) fail('two assessment files are required: nbcc diff before.json after.json');
  const before = loadAssessment(positional[0]);
  const after = loadAssessment(positional[1]);
  const d = diffAssessments(before, after);
  if (flags.json) return out(JSON.stringify(d, null, 2));

  const s = d.summary;
  const arrow = (v) => (v > 0 ? `${C.green}+${v}${C.reset}` : v < 0 ? `${C.red}${v}${C.reset}` : `${C.dim}0${C.reset}`);
  out(`${C.bold}Posture change${C.reset} ${C.dim}${d.before.date} to ${d.after.date}${C.reset}\n`);
  out(`  Implementation  ${padStart(d.before.scores.implementation + '%', 6)} \u2192 ${padStart(d.after.scores.implementation + '%', 6)}  ${arrow(s.implementationDelta)}`);
  out(`  Posture         ${padStart(d.before.scores.posture + '%', 6)} \u2192 ${padStart(d.after.scores.posture + '%', 6)}  ${arrow(s.postureDelta)}`);
  out(`  Controls met    ${padStart(d.before.scores.controlsMet, 6)} \u2192 ${padStart(d.after.scores.controlsMet, 6)}  ${arrow(s.controlsMetDelta)}`);
  out(`  Band            ${s.bandBefore} \u2192 ${s.bandAfter}${s.bandMoved ? ` ${C.bold}moved${C.reset}` : ''}`);

  if (d.regressions.length) {
    out(`\n${C.red}${C.bold}Regressions (${d.regressions.length})${C.reset}`);
    for (const c of d.regressions) {
      out(`  ${pad(c.id, 9)} ${pad(c.title, 40)} ${c.stateBefore} \u2192 ${C.red}${c.stateAfter}${C.reset}`);
      for (const k of c.checkChanges.slice(0, 3)) out(`    ${C.dim}${k.from} \u2192 ${k.to}: ${wrap(k.text, 58)[0]}${C.reset}`);
    }
  }
  if (d.improvements.length) {
    out(`\n${C.green}Improvements (${d.improvements.length})${C.reset}`);
    for (const c of d.improvements.slice(0, 15)) {
      out(`  ${pad(c.id, 9)} ${pad(c.title, 40)} ${c.stateBefore} \u2192 ${C.green}${c.stateAfter}${C.reset}`);
    }
  }
  if (!d.changes.length) out(`\n${C.dim}No control changed state between the two assessments.${C.reset}`);
}

function cmdDoctor(flags) {
  const catalogProblems = validateCatalog();
  if (flags.json) return out(JSON.stringify({ catalog: catalogProblems, stats: CATALOG_STATS }, null, 2));
  out(`${C.bold}${m('doctorHead')}${C.reset}\n`);
  const DW = arabic() ? 18 : 16;
  out(`  ${pad(m('docControls'), DW)}${CATALOG_STATS.controls}`);
  out(`  ${pad(m('docChecks'), DW)}${CATALOG_STATS.checks}`);
  out(`  ${pad(m('docEvidence'), DW)}${CATALOG_STATS.evidenceItems}`);
  out(`  ${pad(m('docFunctions'), DW)}${FUNCTIONS.length}`);
  out(`  ${pad(m('docMilestones'), DW)}${milestones().map((stone) => stone.due).join(', ')}`);
  if (catalogProblems.length) {
    out(`\n  ${C.red}${m('docProblems', catalogProblems.length)}${C.reset}`);
    for (const p of catalogProblems) out(`    ${p}`);
    process.exit(1);
  }
  out(`\n  ${C.green}${m('doctorOk')}${C.reset}`);
}

function main() {
  const argv = process.argv.slice(2);
  const { flags, positional } = parseArgs(argv);
  const command = positional.shift();

  // One decision, applied to every string the run prints.
  M = flags.ar ? MESSAGES.ar : MESSAGES.en;

  if (!command || command === 'help' || flags.help) return help();
  if (command === 'version' || flags.version) return out(VERSION);

  switch (command) {
    case 'catalog':
    case 'controls':
      return cmdCatalog(flags);
    case 'show':
      return cmdShow(positional, flags);
    case 'search':
      return cmdSearch(positional, flags);
    case 'deadline':
      return cmdDeadline(flags);
    case 'init':
      return cmdInit(flags);
    case 'assess':
      return cmdAssess(positional, flags);
    case 'plan':
      return cmdPlan(positional, flags);
    case 'evidence':
      return cmdEvidence(positional, flags);
    case 'crosswalk':
    case 'map':
      return cmdCrosswalk(flags);
    case 'report':
      return cmdReport(positional, flags);
    case 'export':
      return cmdExport(positional, flags);
    case 'portfolio':
    case 'group':
      return cmdPortfolio(positional, flags);
    case 'trend':
    case 'forecast':
      return cmdTrend(positional, flags);
    case 'diff':
      return cmdDiff(positional, flags);
    case 'doctor':
      return cmdDoctor(flags);
    default:
      return fail(`unknown command "${command}". Run "nbcc help" for the list.`);
  }
}

main();
