// Scores an assessment file against the Kuwait NBCC catalog.

import { CONTROLS, FUNCTIONS, REGULATION, getControl, appliesTo, normalizeProfile } from './catalog.js';

/*
 * Status model.
 *
 *   met        implemented and evidenced
 *   partial    started but not complete, counts as half
 *   gap        not implemented
 *   exception  not implemented, covered by a documented time bound exception
 *   na         not applicable to this entity, needs a written justification
 *   unknown    not yet assessed, scored as zero and reported separately
 *
 * Article 4 of the Decision permits deviation from a mandatory requirement only
 * through a documented, time bound, risk assessed exception. So an exception in
 * date counts toward defensible posture but never toward implementation, and an
 * expired exception falls back to a gap.
 */
export const STATUSES = ['met', 'partial', 'gap', 'exception', 'na', 'unknown'];

const IMPLEMENTATION_WEIGHT = { met: 1, partial: 0.5, gap: 0, exception: 0, na: 0, unknown: 0 };
const POSTURE_WEIGHT = { met: 1, partial: 0.5, gap: 0, exception: 1, na: 0, unknown: 0 };

export const BANDS = [
  { min: 0, max: 24.999, key: 'initial', label: 'Initial', labelAr: 'مبدئي', color: '#dc2626' },
  { min: 25, max: 49.999, key: 'developing', label: 'Developing', labelAr: 'قيد التطوير', color: '#ea580c' },
  { min: 50, max: 74.999, key: 'progressing', label: 'Progressing', labelAr: 'متقدم', color: '#d97706' },
  { min: 75, max: 94.999, key: 'substantial', label: 'Substantial', labelAr: 'متقدم جوهريا', color: '#2563eb' },
  { min: 95, max: 100, key: 'baseline', label: 'Baseline met', labelAr: 'مستوفٍ للحد الأدنى', color: '#059669' }
];

export function bandFor(percent) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return BANDS.find((b) => p >= b.min && p <= b.max) || BANDS[0];
}

function isoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeStatus(value) {
  if (value === undefined || value === null || value === '') return 'unknown';
  const s = String(value).trim().toLowerCase();
  if (STATUSES.includes(s)) return s;
  if (s === 'yes' || s === 'true' || s === 'done' || s === 'implemented') return 'met';
  if (s === 'no' || s === 'false' || s === 'missing') return 'gap';
  if (s === 'in progress' || s === 'in-progress' || s === 'wip') return 'partial';
  if (s === 'n/a' || s === 'not applicable') return 'na';
  return 'unknown';
}

function readCheckStatuses(entry, control) {
  const n = control.checks.length;
  const out = new Array(n).fill('unknown');
  if (!entry) return { statuses: out, claimed: null, claimedChecks: 0 };

  const raw = entry.checks;
  if (Array.isArray(raw)) {
    for (let i = 0; i < n; i += 1) out[i] = normalizeStatus(raw[i]);
  } else if (raw && typeof raw === 'object') {
    for (let i = 0; i < n; i += 1) out[i] = normalizeStatus(raw[String(i)] ?? raw[i]);
  }

  // A control level status is a default for the checks nobody answered. It is
  // never an override of one that was answered, so a recorded gap survives a
  // sweeping claim of compliance made higher up the file.
  let claimed = null;
  let claimedChecks = 0;
  if (entry.status !== undefined) {
    const s = normalizeStatus(entry.status);
    if (s !== 'unknown') {
      claimed = s;
      for (let i = 0; i < n; i += 1) {
        if (out[i] === 'unknown') {
          out[i] = s;
          claimedChecks += 1;
        }
      }
    }
  }
  return { statuses: out, claimed, claimedChecks };
}

function exceptionState(entry, asOf) {
  const ex = entry && entry.exception;
  if (!ex) return { present: false, valid: false, expired: false, reasons: ['No exception record.'] };
  const reasons = [];
  const expiry = isoDate(ex.expiry);
  if (!ex.reason || !String(ex.reason).trim()) reasons.push('Exception has no documented reason.');
  if (ex.riskAccepted !== true) reasons.push('Exception has no recorded risk acceptance.');
  if (!expiry) reasons.push('Exception has no valid expiry date.');
  const expired = Boolean(expiry && expiry < asOf);
  if (expired) reasons.push(`Exception expired on ${ex.expiry}.`);
  return { present: true, valid: reasons.length === 0, expired, expiry: ex.expiry || null, reasons };
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/*
 * Scores one assessment. Returns per control results, per function rollups,
 * headline scores, and a findings list that explains every deduction.
 */
export function assess(assessment = {}, options = {}) {
  // The assessment date is the natural anchor, but a caller can ask what the
  // same file looks like on another day, which is how an exception that has
  // since expired gets caught without editing the file.
  const asOf = options.asOf || isoDate(assessment.assessmentDate) || new Date();
  const profile = normalizeProfile(assessment.profile);
  const entries = assessment.controls && typeof assessment.controls === 'object' ? assessment.controls : {};
  const findings = [];
  const results = [];

  for (const control of CONTROLS) {
    const inScope = appliesTo(control, profile);
    const entry = entries[control.id] || null;
    const { statuses, claimed, claimedChecks } = readCheckStatuses(entry, control);
    const ex = exceptionState(entry, asOf);

    // An exception that is expired or incomplete cannot shelter a check.
    const effective = statuses.map((s) => {
      if (s !== 'exception') return s;
      if (!ex.present || ex.expired || !ex.valid) return 'gap';
      return 'exception';
    });

    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const s of effective) counts[s] += 1;

    const scored = effective.filter((s) => s !== 'na').length;
    const naCount = counts.na;
    const implPoints = effective.reduce((n, s) => n + IMPLEMENTATION_WEIGHT[s], 0);
    const postPoints = effective.reduce((n, s) => n + POSTURE_WEIGHT[s], 0);

    const implementation = inScope ? pct(implPoints, scored) : null;
    const posture = inScope ? pct(postPoints, scored) : null;

    let state = 'unknown';
    if (!inScope) state = 'out-of-scope';
    else if (scored === 0) state = 'not-applicable';
    else if (counts.unknown === scored) state = 'unassessed';
    else if (implementation === 100) state = 'met';
    else if (posture === 100) state = 'covered-by-exception';
    else if (implPoints === 0 && counts.exception === 0) state = 'gap';
    else state = 'partial';

    if (inScope) {
      if (naCount > 0 && !(entry && entry.na && String(entry.na.justification || '').trim())) {
        findings.push({
          severity: 'high',
          control: control.id,
          issue: `${naCount} check(s) marked not applicable without a written justification.`,
          fix: 'Add a na.justification field recording why the requirement does not apply to this entity.'
        });
      }
      if (ex.present && !ex.valid) {
        for (const reason of ex.reasons) {
          findings.push({
            severity: ex.expired ? 'high' : 'medium',
            control: control.id,
            issue: reason,
            fix: 'GOV-2 requires every deviation to carry a documented risk acceptance and an expiry date.'
          });
        }
      }
      if (counts.exception > 0 && ex.valid && ex.expiry) {
        const days = Math.ceil((isoDate(ex.expiry) - asOf) / 86400000);
        if (days <= 90) {
          findings.push({
            severity: days <= 30 ? 'medium' : 'low',
            control: control.id,
            issue: `Exception expires in ${days} day(s) on ${ex.expiry}.`,
            fix: 'Close the underlying gap or renew the exception with a fresh risk acceptance before expiry.'
          });
        }
      }
      if (claimedChecks > 0 && (claimed === 'met' || claimed === 'partial')) {
        findings.push({
          severity: 'low',
          control: control.id,
          issue: `${claimedChecks} check(s) scored from a control level status of "${claimed}" rather than an individual answer.`,
          fix: 'Answer each check separately so the self assessment required by GOV-5 shows its working.'
        });
      }
      if (state === 'unassessed') {
        findings.push({
          severity: 'medium',
          control: control.id,
          issue: 'Control has not been assessed.',
          fix: 'Record a status for each check so the self assessment under GOV-5 is complete.'
        });
      }
      if (!entry || !entry.owner) {
        findings.push({
          severity: 'low',
          control: control.id,
          issue: 'No owner recorded.',
          fix: 'GOV-1 requires documented responsibilities, so name an owner for the control.'
        });
      }
    }

    results.push({
      id: control.id,
      fn: control.fn,
      title: control.title,
      titleAr: control.titleAr,
      phase: control.phase,
      effort: control.effort,
      cadence: control.cadence,
      inScope,
      state,
      implementation,
      posture,
      counts,
      scoredChecks: scored,
      totalChecks: control.checks.length,
      statuses: effective,
      owner: (entry && entry.owner) || null,
      notes: (entry && entry.notes) || null,
      targetDate: (entry && entry.targetDate) || null,
      evidence: Array.isArray(entry && entry.evidence) ? entry.evidence : [],
      exception: ex.present ? { ...ex } : null,
      openChecks: control.checks
        .map((text, i) => ({ index: i, text, status: effective[i] }))
        .filter((c) => c.status === 'gap' || c.status === 'partial' || c.status === 'unknown')
    });
  }

  const inScopeResults = results.filter((r) => r.inScope);
  const scoredTotal = inScopeResults.reduce((n, r) => n + r.scoredChecks, 0);
  const implTotal = inScopeResults.reduce(
    (n, r) => n + r.statuses.reduce((m, s) => m + IMPLEMENTATION_WEIGHT[s], 0),
    0
  );
  const postTotal = inScopeResults.reduce(
    (n, r) => n + r.statuses.reduce((m, s) => m + POSTURE_WEIGHT[s], 0),
    0
  );

  const byFunction = FUNCTIONS.map((fn) => {
    const rows = inScopeResults.filter((r) => r.fn === fn.id);
    const scored = rows.reduce((n, r) => n + r.scoredChecks, 0);
    const impl = rows.reduce((n, r) => n + r.statuses.reduce((m, s) => m + IMPLEMENTATION_WEIGHT[s], 0), 0);
    const post = rows.reduce((n, r) => n + r.statuses.reduce((m, s) => m + POSTURE_WEIGHT[s], 0), 0);
    return {
      id: fn.id,
      name: fn.name,
      nameAr: fn.nameAr,
      color: fn.color,
      controls: rows.length,
      scoredChecks: scored,
      implementation: pct(impl, scored),
      posture: pct(post, scored),
      met: rows.filter((r) => r.state === 'met').length,
      gaps: rows.filter((r) => r.state === 'gap').length,
      unassessed: rows.filter((r) => r.state === 'unassessed').length
    };
  }).filter((f) => f.controls > 0);

  const implementation = pct(implTotal, scoredTotal);
  const posture = pct(postTotal, scoredTotal);

  const totals = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of inScopeResults) for (const s of STATUSES) totals[s] += r.counts[s];

  const severityRank = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.control.localeCompare(b.control));

  return {
    regulation: REGULATION,
    entity: assessment.entity || { name: 'Unnamed entity' },
    assessor: assessment.assessor || null,
    assessmentDate: (assessment.assessmentDate || asOf.toISOString().slice(0, 10)).slice(0, 10),
    profile,
    scores: {
      implementation,
      posture,
      band: bandFor(implementation),
      controlsInScope: inScopeResults.length,
      controlsOutOfScope: results.length - inScopeResults.length,
      controlsMet: inScopeResults.filter((r) => r.state === 'met').length,
      controlsPartial: inScopeResults.filter((r) => r.state === 'partial').length,
      controlsGap: inScopeResults.filter((r) => r.state === 'gap').length,
      controlsUnassessed: inScopeResults.filter((r) => r.state === 'unassessed').length,
      controlsExcepted: inScopeResults.filter((r) => r.state === 'covered-by-exception').length,
      scoredChecks: scoredTotal,
      checkTotals: totals,
      coverage: pct(scoredTotal - totals.unknown, scoredTotal)
    },
    byFunction,
    controls: results,
    findings
  };
}

/*
 * Builds a starter assessment with every check unanswered, so an entity can
 * begin from a complete and correctly shaped file rather than a blank page.
 */
export function scaffold(options = {}) {
  const profile = normalizeProfile(options.profile);
  const controls = {};
  for (const control of CONTROLS) {
    if (!appliesTo(control, profile)) continue;
    controls[control.id] = {
      owner: '',
      status: 'unknown',
      checks: new Array(control.checks.length).fill('unknown'),
      evidence: [],
      targetDate: '',
      notes: ''
    };
  }
  return {
    nbcc: '1',
    entity: {
      name: options.entityName || '',
      sector: options.sector || '',
      contact: ''
    },
    assessor: options.assessor || '',
    assessmentDate: options.date || new Date().toISOString().slice(0, 10),
    profile,
    controls
  };
}

/*
 * Validates the shape of an assessment file before it is scored, so a typo in a
 * status or an unknown control id is reported rather than silently ignored.
 */
export function validateAssessment(assessment) {
  const problems = [];
  if (!assessment || typeof assessment !== 'object') {
    return ['Assessment is not an object.'];
  }
  if (!assessment.controls || typeof assessment.controls !== 'object') {
    problems.push('Assessment has no controls object.');
    return problems;
  }
  if (assessment.assessmentDate && !isoDate(assessment.assessmentDate)) {
    problems.push(`assessmentDate "${assessment.assessmentDate}" is not a valid date.`);
  }
  for (const [id, entry] of Object.entries(assessment.controls)) {
    const control = getControl(id);
    if (!control) {
      problems.push(`Unknown control id "${id}".`);
      continue;
    }
    if (!entry || typeof entry !== 'object') {
      problems.push(`${id} entry is not an object.`);
      continue;
    }
    if (Array.isArray(entry.checks) && entry.checks.length !== control.checks.length) {
      problems.push(
        `${id} has ${entry.checks.length} check statuses but the catalog defines ${control.checks.length}.`
      );
    }
    const values = Array.isArray(entry.checks)
      ? entry.checks
      : entry.checks && typeof entry.checks === 'object'
        ? Object.values(entry.checks)
        : [];
    for (const v of values) {
      if (v === null || v === undefined || v === '') continue;
      if (!STATUSES.includes(String(v).trim().toLowerCase()) && normalizeStatus(v) === 'unknown') {
        problems.push(`${id} has unrecognised check status "${v}".`);
      }
    }
    if (entry.status !== undefined && normalizeStatus(entry.status) === 'unknown' && entry.status !== 'unknown') {
      problems.push(`${id} has unrecognised control status "${entry.status}".`);
    }
    if (entry.targetDate && !isoDate(entry.targetDate)) {
      problems.push(`${id} has invalid targetDate "${entry.targetDate}".`);
    }
    if (entry.exception && entry.exception.expiry && !isoDate(entry.exception.expiry)) {
      problems.push(`${id} has invalid exception expiry "${entry.exception.expiry}".`);
    }
  }
  return problems;
}
