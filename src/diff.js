// Compares two assessments so an entity can show movement between review cycles.

import { assess } from './assess.js';
import { getControl } from './catalog.js';

const RANK = { gap: 0, unassessed: 1, unknown: 1, partial: 2, 'covered-by-exception': 3, met: 4, 'not-applicable': 5, 'out-of-scope': 5 };

function delta(before, after) {
  if (before === null || after === null) return null;
  return Math.round((after - before) * 10) / 10;
}

/*
 * GOV-5 asks entities to run the self assessment at least annually and to feed
 * incidents and audits back into priorities. A diff is what turns two of those
 * annual snapshots into an argument about direction of travel, and it is also
 * what catches a control that quietly regressed while attention was elsewhere.
 */
export function diffAssessments(before, after) {
  const a = assess(before);
  const b = assess(after);
  const beforeById = new Map(a.controls.map((c) => [c.id, c]));
  const changes = [];

  for (const now of b.controls) {
    const then = beforeById.get(now.id);
    if (!then) continue;
    const stateChanged = then.state !== now.state;
    const implDelta = delta(then.implementation, now.implementation);
    if (!stateChanged && (implDelta === null || implDelta === 0)) continue;

    const rankBefore = RANK[then.state] ?? 1;
    const rankAfter = RANK[now.state] ?? 1;
    let direction = 'changed';
    if (rankAfter > rankBefore || (implDelta || 0) > 0) direction = 'improved';
    if (rankAfter < rankBefore || (implDelta || 0) < 0) direction = 'regressed';
    if (rankAfter > rankBefore && (implDelta || 0) < 0) direction = 'mixed';

    const control = getControl(now.id);
    const checkChanges = [];
    for (let i = 0; i < now.statuses.length; i += 1) {
      const was = then.statuses[i];
      const is = now.statuses[i];
      if (was !== is) {
        checkChanges.push({ index: i, text: control.checks[i], from: was, to: is });
      }
    }

    changes.push({
      id: now.id,
      title: now.title,
      fn: now.fn,
      direction,
      stateBefore: then.state,
      stateAfter: now.state,
      implementationBefore: then.implementation,
      implementationAfter: now.implementation,
      implementationDelta: implDelta,
      checkChanges
    });
  }

  const regressions = changes.filter((c) => c.direction === 'regressed');
  const improvements = changes.filter((c) => c.direction === 'improved');

  return {
    before: { date: a.assessmentDate, entity: a.entity, scores: a.scores },
    after: { date: b.assessmentDate, entity: b.entity, scores: b.scores },
    summary: {
      implementationDelta: delta(a.scores.implementation, b.scores.implementation),
      postureDelta: delta(a.scores.posture, b.scores.posture),
      controlsMetDelta: b.scores.controlsMet - a.scores.controlsMet,
      controlsChanged: changes.length,
      improved: improvements.length,
      regressed: regressions.length,
      bandBefore: a.scores.band.label,
      bandAfter: b.scores.band.label,
      bandMoved: a.scores.band.key !== b.scores.band.key
    },
    byFunction: b.byFunction.map((fn) => {
      const prior = a.byFunction.find((f) => f.id === fn.id);
      return {
        id: fn.id,
        name: fn.name,
        color: fn.color,
        before: prior ? prior.implementation : null,
        after: fn.implementation,
        delta: prior ? delta(prior.implementation, fn.implementation) : null
      };
    }),
    regressions,
    improvements,
    changes: changes.sort((x, y) => {
      const order = { regressed: 0, mixed: 1, changed: 2, improved: 3 };
      return order[x.direction] - order[y.direction] || x.id.localeCompare(y.id);
    })
  };
}
