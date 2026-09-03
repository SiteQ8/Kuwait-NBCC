/*
 * Builds docs/index.html from site/app.html by injecting the catalog.
 *
 * The site and the command line tool read the same control data, so the page
 * cannot drift from the CLI. Run this after any edit to src/controls or to the
 * crosswalk, and the test suite will fail if the shipped page falls behind.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { REGULATION, FUNCTIONS, CONTROLS, PROFILE_FLAGS } from '../src/catalog.js';
import { ISO_MAP } from '../src/crosswalk.js';
import { PHASES, DEPENDENCIES } from '../src/plan.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

export function buildPayload() {
  return {
    regulation: REGULATION,
    functions: FUNCTIONS,
    controls: CONTROLS.map((c) => ({
      id: c.id,
      fn: c.fn,
      title: c.title,
      titleAr: c.titleAr,
      purpose: c.purpose,
      purposeAr: c.purposeAr,
      requirement: c.requirement,
      checks: c.checks,
      evidence: c.evidence,
      cadence: c.cadence,
      effort: c.effort,
      phase: c.phase,
      appliesWhen: c.appliesWhen,
      crosswalk: c.crosswalk
    })),
    iso: ISO_MAP,
    phases: PHASES.map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      monthsFromPublication: p.monthsFromPublication
    })),
    deps: DEPENDENCIES,
    profileFlags: PROFILE_FLAGS
  };
}

export function buildSite() {
  const template = readFileSync(resolve(root, 'site/app.html'), 'utf8');
  if (!template.includes('__DATA__')) {
    throw new Error('site/app.html no longer contains the __DATA__ placeholder.');
  }
  // The payload sits inside a script tag of type application/json, so the only
  // sequence that can break out of it is a literal closing script tag.
  const json = JSON.stringify(buildPayload()).replace(/<\/script/gi, '<\\/script');
  return template.replace('__DATA__', json);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const html = buildSite();
  const out = resolve(root, 'docs/index.html');
  writeFileSync(out, html, 'utf8');
  process.stdout.write(
    `Built docs/index.html  ${Math.round(html.length / 1024)} KB  ${CONTROLS.length} controls, ` +
      `${CONTROLS.reduce((n, c) => n + c.checks.length, 0)} checks\n`
  );
}
