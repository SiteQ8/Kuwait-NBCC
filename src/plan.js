// Turns an assessment into a sequenced readiness plan against the NBCC deadline.

import { REGULATION, getControl } from './catalog.js';
import { assess } from './assess.js';

const DAY = 86400000;

/*
 * Controls that unblock other controls. A gap in a prerequisite is worth more
 * than a gap in a leaf, because the prerequisite has to land before the work it
 * feeds can even be scoped. The edges below follow the text of the Annex: the
 * data classification programme of GOV-3 is the input to every rule that treats
 * Sensitive data differently, and the inventories of ID-1 and ID-2 define the
 * population that the Protect and Detect controls have to cover.
 */
export const DEPENDENCIES = {
  'GOV-3': ['ID-3', 'PR-5', 'PR-3', 'CLD-8', 'CLD-11', 'CLD-12', 'CLD-13'],
  'ID-1': ['PR-1', 'PR-1.1', 'PR-1.2', 'PR-4', 'PR-6', 'DE-1', 'DE-2'],
  'ID-2': ['PR-1', 'PR-4.1', 'GOV-6'],
  'ID-3': ['PR-2', 'CLD-9', 'CLD-10'],
  'GOV-1': ['GOV-2', 'GOV-5', 'RS-1'],
  'GOV-2': ['GOV-5'],
  'GOV-6': ['CLD-1', 'CLD-2', 'CLD-3', 'CLD-4', 'CLD-5', 'CLD-6', 'CLD-7'],
  'DE-2': ['DE-1'],
  'DE-1': ['RS-2'],
  'RS-1': ['RS-2'],
  'PR-5': ['RC-1'],
  'RC-1': ['RC-2']
};

export const PHASES = [
  {
    id: 1,
    key: 'establish',
    name: 'Establish',
    nameAr: 'التأسيس',
    monthsFromPublication: 6,
    blurb:
      'Stand up accountability, policy and the inventories everything else depends on, plus the protections that cost least and stop most.',
    blurbAr:
      'إرساء المساءلة والسياسات والحصر الذي تعتمد عليه بقية الأعمال ثم تفعيل الحمايات الأقل كلفة والأكثر أثرا.'
  },
  {
    id: 2,
    key: 'engineer',
    name: 'Engineer',
    nameAr: 'التنفيذ الهندسي',
    monthsFromPublication: 13,
    blurb:
      'Deliver the technical work that needs design, budget and change windows, such as hardening, segmentation, vulnerability management and central logging.',
    blurbAr:
      'إنجاز الأعمال التقنية التي تحتاج تصميما وميزانية ونوافذ تغيير مثل التحصين والتجزئة وإدارة الثغرات والتسجيل المركزي.'
  },
  {
    id: 3,
    key: 'evidence',
    name: 'Evidence',
    nameAr: 'الإثبات',
    monthsFromPublication: 18,
    blurb:
      'Prove the baseline works. Run the tests, complete the self assessment, and assemble the evidence pack that NCSC can ask for.',
    blurbAr:
      'إثبات فاعلية الضوابط عبر تنفيذ الاختبارات وإتمام التقييم الذاتي وتجهيز حزمة الأدلة التي قد يطلبها المركز.'
  }
];

function addMonths(iso, months) {
  const d = new Date(iso + 'T00:00:00Z');
  const target = new Date(d);
  target.setUTCMonth(target.getUTCMonth() + months);
  return target.toISOString().slice(0, 10);
}

export function milestones() {
  return PHASES.map((p) => ({
    ...p,
    due: addMonths(REGULATION.publishedOn, p.monthsFromPublication)
  }));
}

/*
 * Where the entity sits in the compliance window defined by Article 7, which
 * runs for eighteen months from publication in the official gazette.
 */
export function deadlineStatus(today = new Date()) {
  const now = today instanceof Date ? today : new Date(today);
  const start = new Date(REGULATION.publishedOn + 'T00:00:00Z');
  const end = new Date(REGULATION.deadline + 'T00:00:00Z');
  const totalDays = Math.round((end - start) / DAY);
  const elapsedDays = Math.round((now - start) / DAY);
  const remainingDays = Math.round((end - now) / DAY);
  const stones = milestones();
  const current = stones.find((m) => new Date(m.due + 'T00:00:00Z') >= now) || stones[stones.length - 1];

  return {
    publishedOn: REGULATION.publishedOn,
    deadline: REGULATION.deadline,
    windowMonths: REGULATION.complianceWindowMonths,
    totalDays,
    elapsedDays: Math.max(0, elapsedDays),
    remainingDays,
    elapsedPercent: Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 1000) / 10)),
    overdue: remainingDays < 0,
    currentPhase: current.id,
    currentPhaseName: current.name,
    milestones: stones.map((m) => ({
      ...m,
      daysRemaining: Math.round((new Date(m.due + 'T00:00:00Z') - now) / DAY),
      passed: new Date(m.due + 'T00:00:00Z') < now
    }))
  };
}

const EFFORT_DAYS = { low: 3, medium: 10, high: 25 };
const STATE_WEIGHT = { gap: 3, unassessed: 2.5, partial: 1.5, 'covered-by-exception': 0.5, met: 0 };

/*
 * Ranks the open work. The score favours prerequisites, earlier phases, larger
 * remaining gaps and lower effort, so the top of the list is the work that both
 * unblocks the most and costs the least to start.
 */
export function prioritize(result) {
  const open = result.controls.filter((c) => c.inScope && c.state !== 'met' && c.state !== 'not-applicable');
  const blockedBy = {};
  for (const [prereq, dependents] of Object.entries(DEPENDENCIES)) {
    for (const d of dependents) {
      blockedBy[d] = blockedBy[d] || [];
      blockedBy[d].push(prereq);
    }
  }

  return open
    .map((c) => {
      const unblocks = (DEPENDENCIES[c.id] || []).filter((d) =>
        open.some((o) => o.id === d)
      );
      const waitingOn = (blockedBy[c.id] || []).filter((p) => open.some((o) => o.id === p));
      const remaining = c.scoredChecks
        ? (c.counts.gap + c.counts.unknown + c.counts.partial * 0.5) / c.scoredChecks
        : 0;
      const stateWeight = STATE_WEIGHT[c.state] ?? 1;
      const phaseWeight = 4 - c.phase;
      const effortDays = EFFORT_DAYS[c.effort];
      const score =
        stateWeight * 10 + phaseWeight * 8 + unblocks.length * 6 + remaining * 12 - effortDays * 0.25;

      return {
        id: c.id,
        title: c.title,
        titleAr: c.titleAr,
        fn: c.fn,
        phase: c.phase,
        effort: c.effort,
        effortDays,
        state: c.state,
        implementation: c.implementation,
        owner: c.owner,
        targetDate: c.targetDate,
        openChecks: c.openChecks.length,
        remainingRatio: Math.round(remaining * 1000) / 10,
        unblocks,
        waitingOn,
        priority: Math.round(score * 10) / 10
      };
    })
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

/*
 * Full plan: where the entity is in the window, what is due in each phase, and
 * a ranked backlog with a rough effort figure per phase.
 */
export function buildPlan(assessment, today = new Date()) {
  const result = assess(assessment);
  const deadline = deadlineStatus(today);
  const backlog = prioritize(result);
  const stones = deadline.milestones;

  const phases = stones.map((m) => {
    const items = backlog.filter((b) => b.phase === m.id);
    const days = items.reduce((n, b) => n + b.effortDays, 0);
    return {
      ...m,
      openControls: items.length,
      estimatedPersonDays: days,
      items
    };
  });

  const totalDays = backlog.reduce((n, b) => n + b.effortDays, 0);
  const workingDaysLeft = Math.max(0, Math.round(deadline.remainingDays * (5 / 7)));

  return {
    entity: result.entity,
    assessmentDate: result.assessmentDate,
    scores: result.scores,
    deadline,
    phases,
    backlog,
    effort: {
      totalPersonDays: totalDays,
      workingDaysRemaining: workingDaysLeft,
      parallelStreamsNeeded: workingDaysLeft > 0 ? Math.max(1, Math.ceil(totalDays / workingDaysLeft)) : null,
      feasible: workingDaysLeft > 0 ? totalDays <= workingDaysLeft * 3 : false
    },
    quickWins: backlog.filter((b) => b.effort === 'low').slice(0, 8),
    prerequisites: backlog.filter((b) => b.unblocks.length > 0).slice(0, 8)
  };
}

/*
 * Evidence pack: what an entity should be able to hand NCSC on request, drawn
 * from the evidence list of every applicable control and annotated with what
 * the assessment says has already been collected.
 */
export function evidencePack(assessment) {
  const result = assess(assessment);
  const items = [];
  for (const row of result.controls) {
    if (!row.inScope) continue;
    const control = getControl(row.id);
    for (const artifact of control.evidence) {
      items.push({
        control: row.id,
        controlTitle: control.title,
        fn: control.fn,
        artifact,
        cadence: control.cadence,
        owner: row.owner,
        state: row.state,
        collected: row.evidence.length > 0
      });
    }
  }
  const byControl = {};
  for (const i of items) {
    byControl[i.control] = byControl[i.control] || [];
    byControl[i.control].push(i);
  }
  return {
    entity: result.entity,
    assessmentDate: result.assessmentDate,
    totalArtifacts: items.length,
    controlsWithEvidenceRecorded: result.controls.filter((c) => c.inScope && c.evidence.length > 0).length,
    retentionYears: REGULATION.recordRetentionYears,
    items,
    byControl
  };
}
