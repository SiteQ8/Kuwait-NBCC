/*
 * Trend and forecast.
 *
 * diff answers what changed between two points. This answers the question a
 * board actually asks: at the rate we are going, do we make 5 October 2027.
 *
 * The projection is deliberately plain. It fits a straight line through the
 * snapshots and extends it to the deadline, and it says so. Compliance work
 * does not really progress linearly, so the value here is not precision, it is
 * being able to tell the difference between a programme that will land and one
 * that will not without anyone having to argue about it.
 */

import { assess } from './assess.js';
import { evidenceRegister } from './evidence.js';
import { deadlineStatus } from './plan.js';
import { REGULATION } from './regulation.js';
import { FUNCTIONS } from './catalog.js';

const DAY = 86400000;

function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function round(n, places = 1) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

/*
 * Least squares slope of y against x. With two points this is just the line
 * through them, which is what you want when that is all there is.
 */
function fitSlope(points) {
  const n = points.length;
  if (n < 2) return 0;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/*
 * Turns a set of assessment files into an ordered series. Snapshots without a
 * usable assessmentDate cannot be placed on a timeline and are reported rather
 * than quietly dropped.
 */
export function buildSeries(assessments) {
  const points = [];
  const rejected = [];

  assessments.forEach((doc, i) => {
    const label = (doc && doc.label) || (doc && doc.entity && doc.entity.name) || `snapshot ${i + 1}`;
    const when = isoDate(doc && doc.assessmentDate);
    if (!when) {
      rejected.push({ label, reason: 'no usable assessmentDate' });
      return;
    }
    const result = assess(doc, { asOf: when });
    const reg = evidenceRegister(doc, when);
    points.push({
      label,
      date: doc.assessmentDate,
      when,
      implementation: result.scores.implementation,
      posture: result.scores.posture,
      coverage: result.scores.coverage,
      band: result.scores.band.key,
      bandName: result.scores.band.label,
      bandNameAr: result.scores.band.labelAr,
      controlsMet: result.scores.controlsMet,
      controlsInScope: result.scores.controlsInScope,
      openFindings: result.findings.length,
      evidenceProducible: reg.producible,
      byFunction: Object.fromEntries(
        result.byFunction.map((f) => [f.id, f.implementation])
      )
    });
  });

  points.sort((a, b) => a.when - b.when);

  const duplicates = [];
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].date === points[i - 1].date) duplicates.push(points[i].date);
  }

  return { points, rejected, duplicates };
}

/*
 * Projects each series forward to the statutory deadline.
 */
export function forecast(assessments, options = {}) {
  const { points, rejected, duplicates } = buildSeries(assessments);

  if (points.length < 2) {
    return {
      ok: false,
      reason: points.length === 0
        ? 'No snapshot carried a usable assessmentDate.'
        : 'A trend needs at least two snapshots taken on different dates.',
      points,
      rejected,
      duplicates
    };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const asOf = options.asOf || last.when;
  const deadline = isoDate(REGULATION.deadline);
  const spanDays = Math.round((last.when - first.when) / DAY);

  if (spanDays === 0) {
    return {
      ok: false,
      reason: 'Every snapshot carries the same date, so no rate can be derived.',
      points,
      rejected,
      duplicates
    };
  }

  const daysToDeadline = Math.round((deadline - asOf) / DAY);

  const track = (key) => {
    const series = points.map((p) => ({ x: (p.when - first.when) / DAY, y: p[key] }));
    const slope = fitSlope(series);
    const current = last[key];
    const recentSpan = Math.round((last.when - points[points.length - 2].when) / DAY);
    const recentSlope = recentSpan === 0
      ? 0
      : (last[key] - points[points.length - 2][key]) / recentSpan;

    const projected = Math.max(0, Math.min(100, current + slope * daysToDeadline));
    const needed = daysToDeadline <= 0 ? null : (100 - current) / daysToDeadline;

    let completionDate = null;
    if (slope > 0 && current < 100) {
      const daysToFull = (100 - current) / slope;
      completionDate = new Date(asOf.getTime() + daysToFull * DAY).toISOString().slice(0, 10);
    } else if (current >= 100) {
      completionDate = last.date;
    }

    let verdict;
    if (current >= 100) verdict = 'complete';
    else if (slope <= 0) verdict = points.every((p, i) => i === 0 || p[key] <= points[i - 1][key])
      ? 'regressing' : 'stalled';
    else if (projected >= 100) verdict = 'on track';
    else if (projected >= 90) verdict = 'close';
    else verdict = 'behind';

    return {
      current,
      first: first[key],
      changeTotal: round(last[key] - first[key]),
      perDay: round(slope, 4),
      perMonth: round(slope * 30.44, 2),
      recentPerDay: round(recentSlope, 4),
      recentPerMonth: round(recentSlope * 30.44, 2),
      projectedAtDeadline: round(projected),
      shortfall: round(Math.max(0, 100 - projected)),
      neededPerDay: needed === null ? null : round(needed, 4),
      neededPerMonth: needed === null ? null : round(needed * 30.44, 2),
      completionDate,
      verdict
    };
  };

  const implementation = track('implementation');
  const posture = track('posture');
  const evidence = track('evidenceProducible');

  // A rate that has changed sharply makes the straight line misleading, so say
  // so rather than let the projection stand unqualified.
  const drift = implementation.perDay === 0
    ? 0
    : round((implementation.recentPerDay - implementation.perDay) / Math.abs(implementation.perDay) * 100);

  const byFunction = FUNCTIONS.map((fn) => {
    const series = points.map((p) => ({ x: (p.when - first.when) / DAY, y: p.byFunction[fn.id] ?? 0 }));
    const slope = fitSlope(series);
    const current = last.byFunction[fn.id] ?? 0;
    return {
      fn: fn.id,
      name: fn.name,
      nameAr: fn.nameAr,
      current,
      changeTotal: round(current - (first.byFunction[fn.id] ?? 0)),
      perMonth: round(slope * 30.44, 2),
      projectedAtDeadline: round(Math.max(0, Math.min(100, current + slope * daysToDeadline)))
    };
  }).sort((a, b) => a.projectedAtDeadline - b.projectedAtDeadline);

  return {
    ok: true,
    entity: last.label || '',
    snapshots: points.length,
    from: first.date,
    to: last.date,
    spanDays,
    deadline: REGULATION.deadline,
    daysToDeadline,
    window: deadlineStatus(asOf),
    implementation,
    posture,
    evidence,
    recentRateDriftPercent: drift,
    byFunction,
    laggards: byFunction.filter((f) => f.projectedAtDeadline < 100).slice(0, 3),
    points,
    rejected,
    duplicates
  };
}
