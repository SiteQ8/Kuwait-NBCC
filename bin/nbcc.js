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

function loadAssessment(path) {
  if (!path) fail('an assessment file is required. Run "nbcc init" to create one.');
  const data = readJSON(path);
  const problems = validateAssessment(data);
  if (problems.length) {
    process.stderr.write(`${C.yellow}warning${C.reset} the assessment file has ${problems.length} issue(s):\n`);
    for (const p of problems.slice(0, 12)) process.stderr.write(`  ${p}\n`);
    if (problems.length > 12) process.stderr.write(`  and ${problems.length - 12} more\n`);
    process.stderr.write('\n');
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
  evidence <file>             Evidence pack checklist
  diff <before> <after>       Posture change between two assessments

${C.bold}Produce a record${C.reset}
  report <file> [--out f]     Self contained HTML report
  export <file> --as md|csv|json

${C.bold}Options${C.reset}
  --ar                        Print the checks and evidence in Arabic
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

  out(`${C.bold}${REGULATION.title}${C.reset}  ${C.dim}${REGULATION.decision}${C.reset}`);
  out(`${C.dim}${list.length} controls, ${list.reduce((n, c) => n + c.checks.length, 0)} checks${C.reset}\n`);
  let current = null;
  for (const c of list) {
    if (c.fn !== current) {
      current = c.fn;
      const fn = getFunction(c.fn);
      out(`${C.bold}${C.cyan}${fn.name}${C.reset} ${C.dim}${fn.nameAr} \u00b7 ${fn.blurb}${C.reset}`);
    }
    out(
      `  ${C.bold}${pad(c.id, 9)}${C.reset} ${pad(c.title, 46)} ${C.dim}${padStart(c.checks.length, 3)} checks  phase ${c.phase}  ${c.effort}${C.reset}`
    );
  }
  out(`\n${C.dim}Run "nbcc show <id>" for the official minimum requirement.${C.reset}`);
}

function cmdShow(positional, flags) {
  const id = positional[0];
  if (!id) fail('a control id is required, for example: nbcc show GOV-1');
  const c = getControl(id);
  if (!c) fail(`unknown control "${id}". Run "nbcc catalog" to list them.`);
  if (flags.json) return out(JSON.stringify({ ...c, mappings: mappingsFor(c.id) }, null, 2));

  const fn = getFunction(c.fn);
  out(`${C.bold}${c.id}${C.reset}  ${C.bold}${c.title}${C.reset}`);
  out(`${C.dim}${c.titleAr}${C.reset}`);
  out(`${C.dim}${fn.name} \u00b7 phase ${c.phase} \u00b7 ${c.effort} effort \u00b7 ${c.cadence}${C.reset}\n`);
  out(`${C.cyan}Purpose${C.reset}`);
  out(`  ${c.purpose}${c.purposeSource === 'editorial' ? `  ${C.dim}(summary, not Annex text)${C.reset}` : ''}\n`);
  out(`${C.cyan}Minimum requirement${C.reset}  ${C.dim}(official text)${C.reset}`);
  // The Annex uses bullets inside some requirements and they carry meaning,
  // so each one keeps its own hanging indent rather than running together.
  for (const para of c.requirement.split('\n')) {
    const bullet = para.startsWith('\u2022');
    const body = bullet ? para.slice(1).trim() : para;
    const lines = wrap(body, bullet ? 72 : 76);
    lines.forEach((line, i) => out(bullet ? `    ${i === 0 ? '\u2022 ' : '  '}${line}` : `  ${line}`));
  }
  out('');
  const ar = Boolean(flags.ar);
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
  out(`${C.cyan}Maps to${C.reset}`);
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
  if (!hits.length) return out(`No control mentions "${term}".`);
  out(`${hits.length} control(s) mention ${C.bold}${term}${C.reset}\n`);
  for (const c of hits) {
    const hit = c.checks.find((k) => k.toLowerCase().includes(term.toLowerCase()));
    out(`  ${C.bold}${pad(c.id, 9)}${C.reset} ${c.title}`);
    if (hit) out(`  ${' '.repeat(9)} ${C.dim}${wrap(hit, 66)[0]}${C.reset}`);
  }
}

function cmdDeadline(flags) {
  const today = flags.date ? new Date(flags.date) : new Date();
  const s = deadlineStatus(today);
  if (flags.json) return out(JSON.stringify(s, null, 2));

  out(`${C.bold}${REGULATION.decision}${C.reset} ${C.dim}${REGULATION.title}${C.reset}`);
  out(`${C.dim}Published ${s.publishedOn} in ${REGULATION.gazette}${C.reset}\n`);
  const headline = s.overdue
    ? `${C.red}${C.bold}The deadline passed ${Math.abs(s.remainingDays)} days ago.${C.reset}`
    : `${C.bold}${s.remainingDays} days${C.reset} remain before full compliance is due on ${C.bold}${s.deadline}${C.reset}.`;
  out(`  ${headline}`);
  out(`  ${bar(s.elapsedPercent, 40)} ${padStart(s.elapsedPercent, 5)}% of the window elapsed\n`);
  out(`${C.cyan}Phase milestones${C.reset}`);
  for (const m of s.milestones) {
    const mark = m.passed ? `${C.red}passed${C.reset}` : `${C.green}${m.daysRemaining} days${C.reset}`;
    out(`  ${m.passed ? '\u25cf' : '\u25cb'} ${pad(m.name, 12)} ${C.dim}due${C.reset} ${m.due}  ${mark}`);
    for (const l of wrap(m.blurb, 66)) out(`    ${C.dim}${l}${C.reset}`);
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
  const r = assess(data);
  if (flags.json) return out(JSON.stringify(r, null, 2));

  const s = r.scores;
  out(`${C.bold}${r.entity.name || 'Unnamed entity'}${C.reset} ${C.dim}assessed ${r.assessmentDate}${C.reset}\n`);
  out(`  Implementation      ${bar(s.implementation)} ${padStart(s.implementation + '%', 6)}`);
  out(`  Defensible posture  ${bar(s.posture)} ${padStart(s.posture + '%', 6)}`);
  out(`  Coverage            ${bar(s.coverage)} ${padStart(s.coverage + '%', 6)}`);
  out(`\n  Band ${C.bold}${s.band.label}${C.reset}   ${s.controlsMet} met \u00b7 ${s.controlsPartial} partial \u00b7 ${C.red}${s.controlsGap} gap${C.reset} \u00b7 ${s.controlsUnassessed} unassessed \u00b7 ${s.controlsExcepted} excepted`);
  out(`  ${s.controlsInScope} controls in scope, ${s.controlsOutOfScope} out of scope, ${s.scoredChecks} checks scored\n`);

  out(`${C.cyan}By function${C.reset}`);
  for (const f of r.byFunction) {
    out(`  ${pad(f.name, 10)} ${bar(f.implementation, 22)} ${padStart(f.implementation + '%', 6)}  ${C.dim}${f.met}/${f.controls} met${C.reset}`);
  }

  const rows = r.controls.filter((c) => c.inScope && (!flags.gaps || c.state !== 'met'));
  const filtered = rows.filter((c) => {
    if (flags.fn && c.fn !== String(flags.fn).toUpperCase()) return false;
    if (flags.phase && c.phase !== Number(flags.phase)) return false;
    return true;
  });
  out(`\n${C.cyan}Controls${C.reset}${flags.gaps ? C.dim + ' (not met only)' + C.reset : ''}`);
  for (const c of filtered) {
    const col = STATE_COLOR[c.state] || '';
    out(
      `  ${C.bold}${pad(c.id, 9)}${C.reset} ${pad(c.title, 44)} ${col}${pad(c.state, 20)}${C.reset} ${padStart(c.implementation === null ? '' : c.implementation + '%', 6)}`
    );
  }

  if (r.findings.length) {
    out(`\n${C.cyan}Findings${C.reset} ${C.dim}(${r.findings.length})${C.reset}`);
    for (const f of r.findings.slice(0, 12)) {
      const col = f.severity === 'high' ? C.red : f.severity === 'medium' ? C.yellow : C.dim;
      out(`  ${col}${pad(f.severity, 7)}${C.reset} ${pad(f.control, 9)} ${f.issue}`);
    }
    if (r.findings.length > 12) out(`  ${C.dim}and ${r.findings.length - 12} more, see "nbcc report"${C.reset}`);
  }
}

function cmdPlan(positional, flags) {
  const data = loadAssessment(positional[0]);
  const p = buildPlan(data, flags.date ? new Date(flags.date) : new Date());
  if (flags.json) return out(JSON.stringify(p, null, 2));

  out(`${C.bold}Readiness plan${C.reset} ${C.dim}${p.entity.name || 'Unnamed entity'}${C.reset}\n`);
  const d = p.deadline;
  out(`  ${bar(d.elapsedPercent, 40)} ${d.remainingDays} days to ${d.deadline}`);
  out(
    `  ${p.effort.totalPersonDays} person days of open work \u00b7 ${p.effort.workingDaysRemaining} working days left \u00b7 ` +
      (p.effort.feasible
        ? `${C.green}achievable with ${p.effort.parallelStreamsNeeded} stream(s)${C.reset}`
        : `${C.red}needs ${p.effort.parallelStreamsNeeded} parallel streams${C.reset}`)
  );

  for (const phase of p.phases) {
    out(`\n${C.cyan}Phase ${phase.id}: ${phase.name}${C.reset} ${C.dim}due ${phase.due}, ${phase.passed ? 'passed' : phase.daysRemaining + ' days'}${C.reset}`);
    for (const l of wrap(phase.blurb, 74)) out(`  ${C.dim}${l}${C.reset}`);
    if (!phase.items.length) {
      out(`  ${C.green}nothing open${C.reset}`);
      continue;
    }
    out(`  ${C.dim}${phase.openControls} open, about ${phase.estimatedPersonDays} person days${C.reset}`);
    for (const item of phase.items) {
      const wait = item.waitingOn.length ? ` ${C.dim}after ${item.waitingOn.join(',')}${C.reset}` : '';
      const unb = item.unblocks.length ? ` ${C.yellow}unblocks ${item.unblocks.length}${C.reset}` : '';
      out(`    ${pad(item.id, 9)} ${pad(item.title, 42)} ${C.dim}${pad(item.effort, 7)}${C.reset}${unb}${wait}`);
    }
  }

  if (p.quickWins.length) {
    out(`\n${C.cyan}Start here${C.reset} ${C.dim}low effort, open now${C.reset}`);
    for (const q of p.quickWins) out(`  ${pad(q.id, 9)} ${q.title}`);
  }
}

function cmdEvidence(positional, flags) {
  const data = loadAssessment(positional[0]);
  const pack = evidencePack(data);
  if (flags.json) return out(JSON.stringify(pack, null, 2));

  out(`${C.bold}Evidence pack${C.reset} ${C.dim}${pack.entity.name || 'Unnamed entity'}${C.reset}`);
  out(`${C.dim}${pack.totalArtifacts} artifacts \u00b7 retain for ${pack.retentionYears} years \u00b7 produce for NCSC on request${C.reset}\n`);
  for (const [id, items] of Object.entries(pack.byControl)) {
    if (flags.fn && items[0].fn !== String(flags.fn).toUpperCase()) continue;
    const col = STATE_COLOR[items[0].state] || '';
    out(`${C.bold}${id}${C.reset} ${items[0].controlTitle} ${col}${items[0].state}${C.reset}`);
    for (const i of items) out(`  ${items[0].collected ? C.green + '\u25a0' : C.dim + '\u25a1'}${C.reset} ${i.artifact}`);
  }
}

function cmdCrosswalk(flags) {
  const to = flags.to ? String(flags.to).toLowerCase() : null;
  if (to && !FRAMEWORKS[to]) fail(`unknown framework "${to}". Use csf, cis or iso.`);

  if (to) {
    const index = reverseIndex(to);
    if (flags.json) return out(JSON.stringify(index, null, 2));
    const fw = FRAMEWORKS[to];
    out(`${C.bold}${fw.name}${C.reset} ${C.dim}to NBCC${C.reset}`);
    out(`${C.dim}${fw.note}${C.reset}\n`);
    for (const row of index) out(`  ${pad(row.ref, 12)} ${row.controls.join(', ')}`);
    return;
  }

  const table = crosswalkTable();
  if (flags.json) return out(JSON.stringify(table, null, 2));
  const cov = coverageSummary();
  out(`${C.bold}NBCC crosswalk${C.reset}\n`);
  for (const key of Object.keys(cov)) {
    const c = cov[key];
    out(`  ${pad(c.shortName, 22)} ${padStart(c.distinctReferences, 3)} ${c.unitPlural} referenced ${C.dim}${c.official ? 'named in the Annex' : 'convenience mapping'}${C.reset}`);
  }
  out('');
  out(`  ${C.dim}${pad('CONTROL', 9)} ${pad('NIST CSF 2.0', 34)} ${pad('CIS v8.1', 30)} ISO 27001${C.reset}`);
  for (const r of table) {
    out(`  ${C.bold}${pad(r.control, 9)}${C.reset} ${pad(r.csf.join(' '), 34)} ${pad(r.cis.join(' '), 30)} ${r.iso.join(' ')}`);
  }
}

function cmdReport(positional, flags) {
  const data = loadAssessment(positional[0]);
  const html = renderReport(data, { today: flags.date ? new Date(flags.date) : new Date() });
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
  } else {
    return fail(`unknown format "${as}". Use md, csv or json.`);
  }
  if (flags.out) {
    writeFileSync(resolve(process.cwd(), String(flags.out)), body + '\n', 'utf8');
    out(`${C.green}Wrote${C.reset} ${flags.out}`);
  } else {
    out(body);
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
  out(`${C.bold}Self check${C.reset}\n`);
  out(`  Controls        ${CATALOG_STATS.controls}`);
  out(`  Checks          ${CATALOG_STATS.checks}`);
  out(`  Evidence items  ${CATALOG_STATS.evidenceItems}`);
  out(`  Functions       ${FUNCTIONS.length}`);
  out(`  Milestones      ${milestones().map((m) => m.due).join(', ')}`);
  if (catalogProblems.length) {
    out(`\n  ${C.red}${catalogProblems.length} catalog problem(s)${C.reset}`);
    for (const p of catalogProblems) out(`    ${p}`);
    process.exit(1);
  }
  out(`\n  ${C.green}Catalog is internally consistent.${C.reset}`);
}

function main() {
  const argv = process.argv.slice(2);
  const { flags, positional } = parseArgs(argv);
  const command = positional.shift();

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
    case 'diff':
      return cmdDiff(positional, flags);
    case 'doctor':
      return cmdDoctor(flags);
    default:
      return fail(`unknown command "${command}". Run "nbcc help" for the list.`);
  }
}

main();
