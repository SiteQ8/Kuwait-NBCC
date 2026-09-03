// Assembles the Kuwait NBCC control catalog and exposes lookup helpers.

import { REGULATION, FUNCTIONS } from './regulation.js';
import { GOVERN } from './controls/govern.js';
import { IDENTIFY } from './controls/identify.js';
import { PROTECT } from './controls/protect.js';
import { DETECT, RESPOND, RECOVER } from './controls/operate.js';
import { CLOUD } from './controls/cloud.js';

export { REGULATION, FUNCTIONS };

export const CONTROLS = Object.freeze([
  ...GOVERN,
  ...IDENTIFY,
  ...PROTECT,
  ...DETECT,
  ...RESPOND,
  ...RECOVER,
  ...CLOUD
]);

const BY_ID = new Map(CONTROLS.map((c) => [c.id, c]));

/*
 * Profile flags decide which conditional controls apply to an entity. Every
 * flag defaults to true, because the safe reading of a mandatory baseline is
 * that a control applies until the entity records a justified reason otherwise.
 * Article 4 of the Decision requires entities to implement the requirements
 * that apply given the nature of their business, assets, systems, data and
 * services, so a flag set to false must be paired with a written justification.
 */
export const PROFILE_FLAGS = [
  {
    key: 'usesCloud',
    label: 'Uses public cloud services',
    labelAr: 'تستخدم خدمات سحابية عامة',
    question: 'Does the entity consume any SaaS, PaaS or IaaS service?',
    affects: 'Appendix A cloud controls, CLD-1 to CLD-16'
  },
  {
    key: 'hasPublicAccounts',
    label: 'Operates official external accounts',
    labelAr: 'تدير حسابات رسمية على منصات خارجية',
    question: 'Does the entity run official accounts on social or video platforms?',
    affects: 'PR-3.1'
  }
];

export const DEFAULT_PROFILE = Object.freeze({
  usesCloud: true,
  hasPublicAccounts: true
});

export function normalizeProfile(profile = {}) {
  const out = {};
  for (const flag of PROFILE_FLAGS) {
    out[flag.key] = profile[flag.key] === undefined ? DEFAULT_PROFILE[flag.key] : Boolean(profile[flag.key]);
  }
  return out;
}

export function getControl(id) {
  if (typeof id !== 'string') return undefined;
  return BY_ID.get(id.trim().toUpperCase());
}

export function appliesTo(control, profile) {
  const p = normalizeProfile(profile);
  return (control.appliesWhen || []).every((flag) => p[flag] === true);
}

export function applicableControls(profile) {
  return CONTROLS.filter((c) => appliesTo(c, profile));
}

export function controlsByFunction(fn) {
  return CONTROLS.filter((c) => c.fn === fn);
}

export function getFunction(id) {
  return FUNCTIONS.find((f) => f.id === id);
}

export function totalChecks(profile) {
  return applicableControls(profile).reduce((n, c) => n + c.checks.length, 0);
}

export function searchControls(term) {
  if (!term) return [];
  const q = String(term).toLowerCase();
  return CONTROLS.filter((c) => {
    const hay = [c.id, c.title, c.purpose, c.requirement, ...c.checks].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

/*
 * Guards against a corrupted catalog. Every field the rest of the tool relies
 * on is asserted here, so a bad edit fails loudly at import time in the test
 * suite rather than producing a quietly wrong compliance score.
 */
export function validateCatalog() {
  const problems = [];
  const seen = new Set();
  const fnIds = new Set(FUNCTIONS.map((f) => f.id));
  const validEffort = new Set(['low', 'medium', 'high']);
  const flagKeys = new Set(PROFILE_FLAGS.map((f) => f.key));

  for (const c of CONTROLS) {
    const where = c.id || '(control with no id)';
    if (!c.id) problems.push('A control is missing an id.');
    if (seen.has(c.id)) problems.push(`Duplicate control id ${c.id}.`);
    seen.add(c.id);
    if (!fnIds.has(c.fn)) problems.push(`${where} declares unknown function ${c.fn}.`);
    for (const field of ['title', 'titleAr', 'purpose', 'purposeAr', 'requirement', 'cadence']) {
      if (!c[field] || typeof c[field] !== 'string' || !c[field].trim()) {
        problems.push(`${where} is missing ${field}.`);
      }
    }
    if (!Array.isArray(c.checks) || c.checks.length === 0) {
      problems.push(`${where} has no checks.`);
    } else if (new Set(c.checks).size !== c.checks.length) {
      problems.push(`${where} has duplicate checks.`);
    }
    if (!Array.isArray(c.evidence) || c.evidence.length === 0) {
      problems.push(`${where} has no evidence items.`);
    }
    // A beyondAnnex entry has to point at a check that exists, or the marker
    // would attach to the wrong statement or to nothing.
    if (c.beyondAnnex !== undefined) {
      if (!Array.isArray(c.beyondAnnex)) {
        problems.push(`${where} has a beyondAnnex that is not an array.`);
      } else {
        for (const i of c.beyondAnnex) {
          if (!Number.isInteger(i) || i < 0 || i >= (c.checks || []).length) {
            problems.push(`${where} marks check ${i} as beyond the Annex, but it has no such check.`);
          }
        }
      }
    }
    // The Arabic is this project's own rendering, so it has to stay in step
    // with the English one for one. A missing line would silently drop a
    // check from the Arabic interface while still counting toward the score.
    for (const [en, ar] of [['checks', 'checksAr'], ['evidence', 'evidenceAr']]) {
      if (!Array.isArray(c[ar])) {
        problems.push(`${where} is missing ${ar}.`);
      } else if (c[ar].length !== (c[en] || []).length) {
        problems.push(`${where} has ${c[ar].length} ${ar} entries but ${(c[en] || []).length} ${en}.`);
      } else if (c[ar].some((v) => !v || !/[\u0600-\u06FF]/.test(v))) {
        problems.push(`${where} has an ${ar} entry with no Arabic script.`);
      }
    }
    if (!validEffort.has(c.effort)) problems.push(`${where} has invalid effort ${c.effort}.`);
    if (![1, 2, 3].includes(c.phase)) problems.push(`${where} has invalid phase ${c.phase}.`);
    for (const flag of c.appliesWhen || []) {
      if (!flagKeys.has(flag)) problems.push(`${where} references unknown profile flag ${flag}.`);
    }
    if (!c.crosswalk || !Array.isArray(c.crosswalk.csf) || !Array.isArray(c.crosswalk.cis)) {
      problems.push(`${where} has an incomplete crosswalk.`);
    }
  }

  return problems;
}

export const CATALOG_STATS = Object.freeze({
  controls: CONTROLS.length,
  checks: CONTROLS.reduce((n, c) => n + c.checks.length, 0),
  checksBeyondAnnex: CONTROLS.reduce((n, c) => n + (c.beyondAnnex || []).length, 0),
  translatedStrings: CONTROLS.reduce(
    (n, c) => n + c.checksAr.length + c.evidenceAr.length + 2, 0
  ),
  evidenceItems: CONTROLS.reduce((n, c) => n + c.evidence.length, 0),
  functions: FUNCTIONS.length
});
