/*
 * Evidence register.
 *
 * Knowing which artifacts a control needs is only half of it. GOV-5 requires
 * the entity to retain assessment records for three years and to produce them
 * for NCSC on request, so the register tracks what is actually held, where it
 * lives, when it was collected, and whether it is still current.
 *
 * Freshness is derived from the control's own cadence rather than a single
 * global expiry, because a weekly discovery review and a biennial policy
 * approval go stale at very different rates. Controls that fire on an event
 * rather than a schedule never go stale, they only have to exist.
 */

import { CONTROLS, getControl, appliesTo, normalizeProfile } from './catalog.js';
import { REGULATION } from './regulation.js';

/*
 * Days after collection at which an artifact stops being good enough to show.
 * Each carries slack beyond the nominal cadence, because an assessor collecting
 * annual evidence in month thirteen is late, not non compliant.
 */
export const REFRESH_DAYS = Object.freeze({
  weekly: 45,
  monthly: 75,
  quarterly: 150,
  annual: 400,
  biennial: 790,
  continuous: 75,
  'per hire': null,
  'per incident': null,
  'per engagement': null
});

// Cadence keys are data, so the Arabic finding text has to render them rather
// than interpolate the English word into an Arabic sentence.
export const CADENCE_AR = Object.freeze({
  weekly: 'أسبوعية', monthly: 'شهرية', quarterly: 'ربع سنوية', annual: 'سنوية',
  biennial: 'كل سنتين', continuous: 'مستمرة', 'per hire': 'عند كل تعيين',
  'per incident': 'عند كل حادث', 'per engagement': 'عند كل تعاقد'
});

export const ITEM_STATES = Object.freeze([
  'missing', 'held', 'stale', 'undated', 'unreferenced', 'misdated'
]);

const DAY = 86400000;

function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addYears(date, years) {
  const d = new Date(date.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

/*
 * Reads whatever the file holds into one record per catalog artifact.
 *
 * Two shapes are accepted. The register form is an array of objects keyed by
 * item index. The older form is a plain array of strings, which earlier files
 * used as free notes, and is read as "held, but nothing about it is provable".
 */
export function readEvidenceRecords(entry, control) {
  const n = control.evidence.length;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    out.push({ item: i, artifact: control.evidence[i], artifactAr: control.evidenceAr[i],
      held: false, reference: '', collected: null, collectedBy: '', note: '', legacy: false });
  }
  const raw = entry && entry.evidence;
  if (!Array.isArray(raw)) return out;

  for (const rec of raw) {
    if (typeof rec === 'string') {
      // Legacy free text. Attach it to the first artifact that has no record
      // rather than guessing which one it describes.
      const slot = out.find((o) => !o.held && !o.note);
      if (slot) {
        slot.note = rec;
        slot.held = true;
        slot.legacy = true;
      }
      continue;
    }
    if (!rec || typeof rec !== 'object') continue;
    const i = Number(rec.item);
    if (!Number.isInteger(i) || i < 0 || i >= n) continue;
    out[i] = {
      ...out[i],
      held: rec.held !== false,
      reference: String(rec.reference || '').trim(),
      collected: typeof rec.collected === 'string' ? rec.collected : null,
      collectedBy: String(rec.collectedBy || '').trim(),
      note: String(rec.note || '').trim(),
      legacy: false
    };
  }
  return out;
}

function itemState(rec, cadence, asOf) {
  if (!rec.held) return { state: 'missing', ageDays: null, retainUntil: null };

  const refresh = REFRESH_DAYS[cadence];
  const when = isoDate(rec.collected);

  if (!when) return { state: 'undated', ageDays: null, retainUntil: null };

  const ageDays = Math.floor((asOf - when) / DAY);
  const retainUntil = addYears(when, REGULATION.recordRetentionYears).toISOString().slice(0, 10);

  if (ageDays < 0) return { state: 'misdated', ageDays, retainUntil };
  if (refresh !== null && ageDays > refresh) return { state: 'stale', ageDays, retainUntil };
  if (!rec.reference) return { state: 'unreferenced', ageDays, retainUntil };
  return { state: 'held', ageDays, retainUntil };
}

/*
 * Builds the register for one assessment. Out of scope controls are excluded
 * entirely, the same way they are excluded from the score.
 */
export function evidenceRegister(assessment, asOf = new Date()) {
  const doc = assessment && typeof assessment === 'object' ? assessment : {};
  const profile = normalizeProfile(doc.profile);
  const entries = doc.controls && typeof doc.controls === 'object' ? doc.controls : {};

  const items = [];
  const findings = [];
  const byControl = {};

  for (const control of CONTROLS) {
    if (!appliesTo(control, profile)) continue;
    const entry = entries[control.id] || null;
    const records = readEvidenceRecords(entry, control);
    const rows = [];

    for (const rec of records) {
      const { state, ageDays, retainUntil } = itemState(rec, control.cadence, asOf);
      const row = {
        control: control.id,
        controlTitle: control.title,
        controlTitleAr: control.titleAr,
        fn: control.fn,
        item: rec.item,
        artifact: rec.artifact,
        artifactAr: rec.artifactAr,
        cadence: control.cadence,
        refreshDays: REFRESH_DAYS[control.cadence],
        owner: (entry && entry.owner) || '',
        held: rec.held,
        reference: rec.reference,
        collected: rec.collected,
        collectedBy: rec.collectedBy,
        note: rec.note,
        legacy: rec.legacy,
        state,
        ageDays,
        retainUntil
      };
      rows.push(row);
      items.push(row);
    }
    byControl[control.id] = rows;

    const missing = rows.filter((r) => r.state === 'missing').length;
    const stale = rows.filter((r) => r.state === 'stale');
    const undated = rows.filter((r) => r.state === 'undated').length;
    const unreferenced = rows.filter((r) => r.state === 'unreferenced').length;
    const misdated = rows.filter((r) => r.state === 'misdated');

    if (missing === rows.length && rows.length > 0) {
      findings.push({
        severity: 'medium',
        control: control.id,
        issue: `No evidence recorded for any of the ${rows.length} artifacts this control needs.`,
        issueAr: `لم يسجل أي دليل من الأدلة ${rows.length} التي يحتاجها هذا الضابط.`,
        fix: 'Record where each artifact is held so it can be produced for NCSC under GOV-5.',
        fixAr: 'سجل موضع حفظ كل دليل حتى يمكن تقديمه للمركز وفق الضابط GOV-5.'
      });
    } else if (missing > 0) {
      findings.push({
        severity: 'low',
        control: control.id,
        issue: `${missing} of ${rows.length} evidence artifacts have no record.`,
        issueAr: `${missing} من ${rows.length} من الأدلة دون تسجيل.`,
        fix: 'Complete the register so the evidence pack is whole before the deadline.',
        fixAr: 'أكمل السجل حتى تكتمل حزمة الأدلة قبل الموعد النهائي.'
      });
    }
    for (const r of stale) {
      findings.push({
        severity: 'medium',
        control: control.id,
        issue: `Evidence "${r.artifact}" is ${r.ageDays} days old. This control has a cadence of ${r.cadence}, so anything past ${r.refreshDays} days is stale.`,
        issueAr: `مضى على الدليل "${r.artifactAr}" ${r.ageDays} يوما، ودورية هذا الضابط ${CADENCE_AR[r.cadence] || r.cadence}، فما تجاوز ${r.refreshDays} يوما يعد متقادما.`,
        fix: 'Collect a current copy. Stale evidence shows a control that once worked, not one that is operating.',
        fixAr: 'اجمع نسخة حديثة، فالدليل المتقادم يثبت ضابطا عمل يوما ما لا ضابطا يعمل الآن.'
      });
    }
    for (const r of misdated) {
      findings.push({
        severity: 'medium',
        control: control.id,
        issue: `Evidence "${r.artifact}" carries a collection date in the future.`,
        issueAr: `الدليل "${r.artifactAr}" يحمل تاريخ جمع في المستقبل.`,
        fix: 'Correct the collected date so the register can be relied on.',
        fixAr: 'صحح تاريخ الجمع حتى يمكن الاعتماد على السجل.'
      });
    }
    if (undated > 0) {
      findings.push({
        severity: 'low',
        control: control.id,
        issue: `${undated} evidence artifact(s) are held but carry no collection date.`,
        issueAr: `${undated} من الأدلة محفوظة دون تاريخ جمع.`,
        fix: 'Record when each artifact was collected so its freshness can be judged.',
        fixAr: 'سجل تاريخ جمع كل دليل حتى يمكن الحكم على حداثته.'
      });
    }
    if (unreferenced > 0) {
      findings.push({
        severity: 'low',
        control: control.id,
        issue: `${unreferenced} evidence artifact(s) are held but record no location.`,
        issueAr: `${unreferenced} من الأدلة محفوظة دون تسجيل موضعها.`,
        fix: 'Record a reference so the artifact can actually be produced on request.',
        fixAr: 'سجل مرجعا لموضع الدليل حتى يمكن تقديمه فعلا عند الطلب.'
      });
    }
  }

  const counts = Object.fromEntries(ITEM_STATES.map((s) => [s, 0]));
  for (const i of items) counts[i.state] += 1;

  const usable = counts.held + counts.unreferenced;
  const coverage = items.length === 0 ? 0 : Math.round((usable / items.length) * 1000) / 10;
  const producible = items.length === 0 ? 0 : Math.round((counts.held / items.length) * 1000) / 10;

  const dated = items.filter((i) => i.collected).map((i) => i.collected).sort();

  return {
    entity: (doc.entity && doc.entity.name) || 'Unnamed entity',
    assessmentDate: doc.assessmentDate || null,
    retentionYears: REGULATION.recordRetentionYears,
    totalArtifacts: items.length,
    counts,
    coverage,
    producible,
    oldestCollected: dated[0] || null,
    newestCollected: dated[dated.length - 1] || null,
    items,
    byControl,
    findings
  };
}

/*
 * Evidence gaps that matter most: a control the entity claims to have met but
 * cannot show. A gap in a control nobody claims is expected, a gap behind a
 * claim is the one that fails an audit.
 */
export function unevidencedClaims(assessment, assessResult, asOf = new Date()) {
  const reg = evidenceRegister(assessment, asOf);
  const out = [];
  for (const row of assessResult.controls) {
    if (!row.inScope) continue;
    if (row.state !== 'met' && row.state !== 'partial') continue;
    const rows = reg.byControl[row.id] || [];
    const usable = rows.filter((r) => r.state === 'held' || r.state === 'unreferenced').length;
    if (usable === 0 && rows.length > 0) {
      out.push({
        control: row.id,
        title: getControl(row.id).title,
        implementation: row.implementation,
        state: row.state,
        artifactsNeeded: rows.length
      });
    }
  }
  return out;
}

/*
 * A flat register suitable for a spreadsheet, which is how most entities will
 * actually work through 164 artifacts.
 */
export function renderRegisterCSV(assessment, asOf = new Date()) {
  const reg = evidenceRegister(assessment, asOf);
  const head = ['control', 'control_title', 'function', 'item', 'artifact', 'artifact_ar',
    'cadence', 'owner', 'state', 'held', 'reference', 'collected', 'collected_by',
    'age_days', 'retain_until', 'note'];
  const q = (v) => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`;
  const lines = [head.join(',')];
  for (const i of reg.items) {
    lines.push([i.control, i.controlTitle, i.fn, i.item + 1, i.artifact, i.artifactAr,
      i.cadence, i.owner, i.state, i.held, i.reference, i.collected, i.collectedBy,
      i.ageDays, i.retainUntil, i.note].map(q).join(','));
  }
  return `${lines.join('\n')}\n`;
}
