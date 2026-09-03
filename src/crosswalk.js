/*
 * Maps NBCC controls onto the frameworks an entity is most likely to already
 * hold evidence against.
 *
 * Section 1 of the Annex states that the baseline is aligned with CIS Controls
 * v8.1 Implementation Group 1 and the NIST Cybersecurity Framework, and Section
 * 5 groups the controls by CSF function. Those two mappings therefore live on
 * each control in the catalog. The ISO/IEC 27001:2022 Annex A mapping below is
 * added by this project as a convenience for entities already certified, and it
 * carries no official standing.
 *
 * A mapping is a pointer, not an equivalence. Holding an ISO certificate does
 * not discharge an NBCC requirement, though it usually means the evidence
 * already exists somewhere.
 */

import { CONTROLS, getControl } from './catalog.js';

export const FRAMEWORKS = {
  csf: {
    key: 'csf',
    name: 'NIST Cybersecurity Framework 2.0',
    shortName: 'NIST CSF 2.0',
    unit: 'subcategory',
    unitPlural: 'subcategories',
    official: true,
    note: 'Named in Section 1 of the Annex as an alignment reference. Section 5 groups the baseline by CSF function.'
  },
  cis: {
    key: 'cis',
    name: 'CIS Controls v8.1, Implementation Group 1',
    shortName: 'CIS v8.1 IG1',
    unit: 'safeguard',
    unitPlural: 'safeguards',
    official: true,
    note: 'Named in Section 1 of the Annex as an alignment reference.'
  },
  iso: {
    key: 'iso',
    name: 'ISO/IEC 27001:2022 Annex A',
    shortName: 'ISO 27001:2022',
    unit: 'control',
    unitPlural: 'controls',
    official: false,
    note: 'Added by this project as a convenience mapping. Not referenced by the Decision.'
  }
};

export const ISO_MAP = {
  'GOV-1': ['A.5.2', 'A.5.4'],
  'GOV-2': ['A.5.1', 'A.5.37'],
  'GOV-3': ['A.5.12', 'A.5.13', 'A.5.34'],
  'GOV-4': ['A.6.1', 'A.6.2', 'A.6.6'],
  'GOV-5': ['A.5.35', 'A.5.36'],
  'GOV-6': ['A.5.19', 'A.5.20', 'A.5.21', 'A.5.22'],
  'ID-1': ['A.5.9', 'A.5.10', 'A.7.9'],
  'ID-2': ['A.5.9', 'A.8.19'],
  'ID-3': ['A.5.9', 'A.5.16', 'A.5.18'],
  'PR-1': ['A.8.9'],
  'PR-1.1': ['A.8.20', 'A.8.22'],
  'PR-1.2': ['A.8.8'],
  'PR-2': ['A.5.15', 'A.5.16', 'A.5.17', 'A.8.5'],
  'PR-2.1': ['A.5.14', 'A.8.1'],
  'PR-2.2': ['A.5.17'],
  'PR-3': ['A.6.3'],
  'PR-3.1': ['A.5.16', 'A.8.5'],
  'PR-4': ['A.8.7', 'A.8.23'],
  'PR-4.1': ['A.5.14', 'A.8.19'],
  'PR-4.2': ['A.7.10', 'A.8.7'],
  'PR-5': ['A.8.13', 'A.8.10', 'A.8.24'],
  'PR-6': ['A.7.1', 'A.7.2', 'A.7.3', 'A.7.4', 'A.7.10'],
  'DE-1': ['A.8.15', 'A.8.16'],
  'DE-2': ['A.8.17'],
  'RS-1': ['A.5.24', 'A.5.25', 'A.6.8'],
  'RS-2': ['A.5.26', 'A.5.27', 'A.5.28'],
  'RC-1': ['A.5.29', 'A.5.30'],
  'RC-2': ['A.5.30'],
  'CLD-1': ['A.5.19', 'A.5.31'],
  'CLD-2': ['A.5.19', 'A.5.21'],
  'CLD-3': ['A.5.22', 'A.5.35'],
  'CLD-4': ['A.5.22', 'A.5.24'],
  'CLD-5': ['A.5.23', 'A.5.9'],
  'CLD-6': ['A.5.22', 'A.5.30'],
  'CLD-7': ['A.5.23'],
  'CLD-8': ['A.5.9'],
  'CLD-9': ['A.8.5'],
  'CLD-10': ['A.5.16', 'A.5.17'],
  'CLD-11': ['A.8.24'],
  'CLD-12': ['A.5.12', 'A.5.34'],
  'CLD-13': ['A.5.12'],
  'CLD-14': ['A.5.15', 'A.8.3'],
  'CLD-15': ['A.8.15'],
  'CLD-16': ['A.8.20', 'A.8.21', 'A.8.24']
};

export function mappingsFor(controlId) {
  const control = getControl(controlId);
  if (!control) return null;
  return {
    control: control.id,
    title: control.title,
    csf: control.crosswalk.csf,
    cis: control.crosswalk.cis,
    iso: ISO_MAP[control.id] || []
  };
}

export function crosswalkTable() {
  return CONTROLS.map((c) => mappingsFor(c.id));
}

/*
 * Reverse index. Answers the question an entity actually asks, which is what a
 * control it already runs for another framework buys it under the NBCC.
 */
export function reverseIndex(framework) {
  const key = String(framework || '').toLowerCase();
  if (!FRAMEWORKS[key]) return null;
  const index = new Map();
  for (const c of CONTROLS) {
    const refs = key === 'iso' ? ISO_MAP[c.id] || [] : c.crosswalk[key] || [];
    for (const ref of refs) {
      if (!index.has(ref)) index.set(ref, []);
      index.get(ref).push(c.id);
    }
  }
  return [...index.entries()]
    .map(([ref, controls]) => ({ ref, controls: controls.sort() }))
    .sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true }));
}

export function coverageSummary() {
  const out = {};
  for (const key of Object.keys(FRAMEWORKS)) {
    const refs = new Set();
    let mapped = 0;
    for (const c of CONTROLS) {
      const list = key === 'iso' ? ISO_MAP[c.id] || [] : c.crosswalk[key] || [];
      if (list.length) mapped += 1;
      for (const r of list) refs.add(r);
    }
    out[key] = {
      ...FRAMEWORKS[key],
      distinctReferences: refs.size,
      nbccControlsMapped: mapped,
      nbccControlsTotal: CONTROLS.length
    };
  }
  return out;
}

export function validateCrosswalk() {
  const problems = [];
  for (const c of CONTROLS) {
    if (!ISO_MAP[c.id]) problems.push(`${c.id} has no ISO 27001 mapping.`);
    if (!c.crosswalk.csf.length) problems.push(`${c.id} has no CSF mapping.`);
    if (!c.crosswalk.cis.length) problems.push(`${c.id} has no CIS mapping.`);
  }
  for (const id of Object.keys(ISO_MAP)) {
    if (!getControl(id)) problems.push(`ISO map references unknown control ${id}.`);
  }
  return problems;
}
