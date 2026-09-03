/*
 * Portfolio roll up.
 *
 * A holding group, a ministry with subordinate bodies, or a consultancy
 * carrying several clients has the same problem: forty four controls times n
 * entities is too much to hold in the head, and the interesting question is
 * not which entity is worst.
 *
 * It is which failures are systemic. A control that is a gap at one entity is
 * that entity's problem. The same control failing at seven of nine is a group
 * problem with a group fix, and treating it as seven separate remediations is
 * how a programme wastes a year.
 */

import { assess } from './assess.js';
import { evidenceRegister, unevidencedClaims } from './evidence.js';
import { deadlineStatus } from './plan.js';
import { CONTROLS, getControl, appliesTo, normalizeProfile } from './catalog.js';
import { FUNCTIONS } from './catalog.js';
import { REGULATION } from './regulation.js';

function round(n, places = 1) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

function median(values) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : round((s[mid - 1] + s[mid]) / 2);
}

/*
 * A control is systemic when it fails across most of the entities it applies
 * to. The threshold is a share rather than a count, because a portfolio of
 * three and a portfolio of thirty are not comparable on raw numbers.
 */
export const SYSTEMIC_SHARE = 0.6;

export function rollUp(assessments, options = {}) {
  const asOf = options.asOf || new Date();
  const window = deadlineStatus(asOf);

  const entities = [];
  const seenNames = new Map();

  assessments.forEach((doc, i) => {
    const name = (doc && doc.entity && doc.entity.name) || (doc && doc.label) || `Entity ${i + 1}`;
    const result = assess(doc, { asOf });
    const reg = evidenceRegister(doc, asOf);
    const claims = unevidencedClaims(doc, result, asOf);
    const profile = normalizeProfile(doc && doc.profile);

    seenNames.set(name, (seenNames.get(name) || 0) + 1);

    entities.push({
      name,
      sector: (doc && doc.entity && doc.entity.sector) || '',
      assessmentDate: (doc && doc.assessmentDate) || null,
      implementation: result.scores.implementation,
      posture: result.scores.posture,
      coverage: result.scores.coverage,
      band: result.scores.band.key,
      bandName: result.scores.band.label,
      bandNameAr: result.scores.band.labelAr,
      controlsMet: result.scores.controlsMet,
      controlsInScope: result.scores.controlsInScope,
      controlsGap: result.scores.controlsGap,
      highFindings: result.findings.filter((f) => f.severity === 'high').length,
      findings: result.findings.length,
      evidenceProducible: reg.producible,
      unevidencedClaims: claims.length,
      usesCloud: profile.usesCloud === true,
      byControl: Object.fromEntries(result.controls.map((c) => [c.id, c])),
      byFunction: Object.fromEntries(result.byFunction.map((f) => [f.id, f.implementation]))
    });
  });

  const duplicateNames = [...seenNames.entries()].filter(([, n]) => n > 1).map(([k]) => k);

  // Every entity carrying the same name almost certainly means a time series
  // was passed to the wrong command.
  const looksLikeSeries = entities.length > 1 && seenNames.size === 1;

  const impl = entities.map((e) => e.implementation);
  const bands = {};
  for (const e of entities) bands[e.band] = (bands[e.band] || 0) + 1;

  const controls = CONTROLS.map((control) => {
    const applicable = entities.filter((e) => {
      const row = e.byControl[control.id];
      return row && row.inScope;
    });
    if (applicable.length === 0) {
      return null;
    }
    const states = { met: 0, partial: 0, gap: 0, 'covered-by-exception': 0, unassessed: 0, 'not-applicable': 0 };
    let sum = 0;
    const failing = [];
    for (const e of applicable) {
      const row = e.byControl[control.id];
      states[row.state] = (states[row.state] || 0) + 1;
      sum += row.implementation || 0;
      if (row.state === 'gap' || row.state === 'unassessed' || (row.implementation || 0) < 50) {
        failing.push(e.name);
      }
    }
    const failShare = failing.length / applicable.length;
    return {
      id: control.id,
      title: control.title,
      titleAr: control.titleAr,
      fn: control.fn,
      phase: control.phase,
      effort: control.effort,
      entitiesApplicable: applicable.length,
      entitiesFailing: failing.length,
      failingNames: failing,
      failShare: round(failShare * 100),
      mean: round(sum / applicable.length),
      states,
      systemic: failShare >= SYSTEMIC_SHARE && applicable.length > 1
    };
  }).filter(Boolean);

  const systemic = controls
    .filter((c) => c.systemic)
    .sort((a, b) => b.failShare - a.failShare || a.mean - b.mean);

  const isolated = controls
    .filter((c) => !c.systemic && c.entitiesFailing > 0)
    .sort((a, b) => a.mean - b.mean);

  const byFunction = FUNCTIONS.map((fn) => {
    const vals = entities.map((e) => e.byFunction[fn.id]).filter((v) => typeof v === 'number');
    return {
      fn: fn.id,
      name: fn.name,
      nameAr: fn.nameAr,
      mean: vals.length ? round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
      lowest: vals.length ? Math.min(...vals) : 0,
      highest: vals.length ? Math.max(...vals) : 0
    };
  }).sort((a, b) => a.mean - b.mean);

  // Exposure ranks who needs attention first: how far from the baseline, how
  // little can be evidenced, and how many claims rest on nothing.
  const ranked = [...entities].sort((a, b) => {
    const score = (e) => (100 - e.implementation) + (100 - e.evidenceProducible) * 0.5 + e.highFindings * 2;
    return score(b) - score(a);
  });

  return {
    asOf: asOf.toISOString().slice(0, 10),
    deadline: REGULATION.deadline,
    daysToDeadline: window.remainingDays,
    entities: entities.length,
    duplicateNames,
    looksLikeSeries,
    scores: {
      meanImplementation: entities.length ? round(impl.reduce((a, b) => a + b, 0) / impl.length) : 0,
      medianImplementation: median(impl),
      lowest: entities.length ? Math.min(...impl) : 0,
      highest: entities.length ? Math.max(...impl) : 0,
      spread: entities.length ? round(Math.max(...impl) - Math.min(...impl)) : 0,
      meanEvidence: entities.length
        ? round(entities.reduce((n, e) => n + e.evidenceProducible, 0) / entities.length) : 0,
      totalUnevidencedClaims: entities.reduce((n, e) => n + e.unevidencedClaims, 0),
      totalHighFindings: entities.reduce((n, e) => n + e.highFindings, 0),
      atBaseline: entities.filter((e) => e.band === 'baseline').length,
      bands
    },
    list: entities,
    ranked,
    byFunction,
    systemic,
    isolated,
    controls
  };
}

/*
 * One row per entity, for the spreadsheet a group function will keep anyway.
 */
export function renderPortfolioCSV(assessments, options = {}) {
  const roll = rollUp(assessments, options);
  const head = ['entity', 'sector', 'assessed', 'implementation', 'posture', 'coverage',
    'band', 'controls_met', 'controls_in_scope', 'controls_gap', 'high_findings',
    'evidence_producible', 'unevidenced_claims'];
  const q = (v) => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`;
  const lines = [head.join(',')];
  for (const e of roll.list) {
    lines.push([e.name, e.sector, e.assessmentDate, e.implementation, e.posture, e.coverage,
      e.bandName, e.controlsMet, e.controlsInScope, e.controlsGap, e.highFindings,
      e.evidenceProducible, e.unevidencedClaims].map(q).join(','));
  }
  return `${lines.join('\n')}\n`;
}
