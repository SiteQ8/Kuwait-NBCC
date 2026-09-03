import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
