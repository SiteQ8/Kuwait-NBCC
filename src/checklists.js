/*
 * Checklists.
 *
 * The baseline is 329 checks across 44 controls, and an entity cannot hand
 * that to one person. The work belongs to different desks: the person who
 * hardens a server does not run the security screening, and neither of them
 * signs the cloud contract.
 *
 * So every control is assigned to exactly one owning role. The property that
 * makes the split useful is that it partitions: hand each role its sheet and
 * between them the whole baseline is covered, with nothing dropped and nothing
 * done twice. A test asserts that, because a split that quietly loses a
 * control is worse than no split at all.
 *
 * The assignment is this project's own reading of who does the work. The Annex
 * does not name roles beyond GOV-1, which requires a designated manager and
 * documented responsibilities.
 */

import { CONTROLS, getControl, appliesTo, normalizeProfile } from './catalog.js';
import { REGULATION } from './regulation.js';
import { count } from './messages.js';

export const ROLES = [
  {
    id: 'leadership',
    name: 'Leadership and governance',
    nameAr: 'الإدارة والحوكمة',
    blurb: 'Accountability, the policy set, the exception process and the annual self assessment.',
    blurbAr: 'المساءلة وحزمة السياسات وآلية الاستثناء والتقييم الذاتي السنوي.',
    controls: ['GOV-1', 'GOV-2', 'GOV-5']
  },
  {
    id: 'data-office',
    name: 'Data and records',
    nameAr: 'البيانات والسجلات',
    blurb: 'Classification, sovereignty, the data and account inventory, and residency.',
    blurbAr: 'التصنيف والسيادة وحصر البيانات والحسابات والتوطين.',
    controls: ['GOV-3', 'ID-3', 'CLD-12', 'CLD-13']
  },
  {
    id: 'hr',
    name: 'Human resources',
    nameAr: 'الموارد البشرية',
    blurb: 'Kuwaitization, security screening for sensitive roles, and the awareness programme.',
    blurbAr: 'التكويت والمسح الأمني للأدوار الحساسة وبرنامج التوعية.',
    controls: ['GOV-4', 'PR-3']
  },
  {
    id: 'procurement',
    name: 'Procurement and contracts',
    nameAr: 'المشتريات والعقود',
    blurb: 'Provider governance, licensing, due diligence and every clause a cloud contract must carry.',
    blurbAr: 'حوكمة المزودين والترخيص والعناية الواجبة وكل بند يجب أن يحمله العقد السحابي.',
    controls: ['GOV-6', 'CLD-1', 'CLD-2', 'CLD-3', 'CLD-4', 'CLD-5', 'CLD-6', 'CLD-7']
  },
  {
    id: 'it-operations',
    name: 'IT operations',
    nameAr: 'عمليات تقنية المعلومات',
    blurb: 'Inventory, hardening, segmentation, patching, endpoint and mail protection, backup and recovery.',
    blurbAr: 'الحصر والتحصين وتجزئة الشبكة والتحديثات وحماية الأجهزة الطرفية والبريد والنسخ الاحتياطي والتعافي.',
    controls: ['ID-1', 'ID-2', 'PR-1', 'PR-1.1', 'PR-1.2', 'PR-4', 'PR-4.1', 'PR-4.2', 'PR-5', 'DE-2', 'RC-1', 'RC-2']
  },
  {
    id: 'security',
    name: 'Security operations',
    nameAr: 'عمليات الأمن',
    blurb: 'Identity and authentication, logging and monitoring, and incident reporting and handling.',
    blurbAr: 'الهوية والمصادقة وتسجيل الأحداث والمراقبة والإبلاغ عن الحوادث والتعامل معها.',
    controls: ['PR-2', 'PR-2.1', 'PR-2.2', 'PR-3.1', 'DE-1', 'RS-1', 'RS-2']
  },
  {
    id: 'cloud',
    name: 'Cloud engineering',
    nameAr: 'هندسة الحوسبة السحابية',
    blurb: 'What the entity configures in the cloud itself, as opposed to what it contracts for.',
    blurbAr: 'ما تهيئه الجهة في السحابة نفسها، تمييزا عما تتعاقد عليه.',
    controls: ['CLD-8', 'CLD-9', 'CLD-10', 'CLD-11', 'CLD-14', 'CLD-15', 'CLD-16']
  },
  {
    id: 'facilities',
    name: 'Facilities',
    nameAr: 'المرافق',
    blurb: 'Physical protection of critical IT areas and of portable equipment.',
    blurbAr: 'الحماية المادية للمناطق التقنية الحرجة وللمعدات المحمولة.',
    controls: ['PR-6']
  }
];

export function getRole(id) {
  if (typeof id !== 'string') return undefined;
  return ROLES.find((r) => r.id === id.trim().toLowerCase());
}

/*
 * The split has to be a partition. A control assigned twice means two desks
 * doing the same work, and one assigned nowhere means a control nobody owns,
 * which is exactly the failure GOV-1 exists to prevent.
 */
export function validateRoles() {
  const problems = [];
  const seen = new Map();
  for (const r of ROLES) {
    for (const id of r.controls) {
      if (!getControl(id)) problems.push(`${r.id} claims ${id}, which is not a control.`);
      if (seen.has(id)) problems.push(`${id} is owned by both ${seen.get(id)} and ${r.id}.`);
      seen.set(id, r.id);
    }
    for (const f of ['name', 'nameAr', 'blurb', 'blurbAr']) {
      if (!r[f]) problems.push(`${r.id} is missing ${f}.`);
    }
  }
  for (const c of CONTROLS) {
    if (!seen.has(c.id)) problems.push(`${c.id} is owned by no role.`);
  }
  return problems;
}

/*
 * Builds the checklist for one role, or for every role when none is named.
 * Filters narrow it to a phase or a function, which is how an entity works a
 * milestone rather than the whole baseline at once.
 */
export function buildChecklist(options = {}) {
  const profile = normalizeProfile(options.profile);
  const roles = options.role ? [getRole(options.role)].filter(Boolean) : ROLES;
  const wantPhase = options.phase ? Number(options.phase) : null;
  const wantFn = options.fn ? String(options.fn).toUpperCase() : null;

  const sections = [];
  for (const role of roles) {
    const controls = role.controls
      .map(getControl)
      .filter((c) => appliesTo(c, profile))
      .filter((c) => (wantPhase ? c.phase === wantPhase : true))
      .filter((c) => (wantFn ? c.fn === wantFn : true))
      .sort((a, b) => a.phase - b.phase || a.id.localeCompare(b.id));
    if (controls.length === 0) continue;
    sections.push({
      role,
      controls,
      checks: controls.reduce((n, c) => n + c.checks.length, 0),
      evidence: controls.reduce((n, c) => n + c.evidence.length, 0)
    });
  }
  return {
    sections,
    roles: sections.length,
    controls: sections.reduce((n, s) => n + s.controls.length, 0),
    checks: sections.reduce((n, s) => n + s.checks, 0),
    filters: { role: options.role || null, phase: wantPhase, fn: wantFn }
  };
}

const T = {
  en: {
    title: 'NBCC field checklist',
    forRole: (r) => `for ${r}`,
    intro: 'One line per check, in the order the work falls. Tick what holds today, note where the evidence sits, and carry the rest into the assessment.',
    assignment: 'Who owns what is this project\'s own reading. The Annex names no roles beyond GOV-1, which requires a designated manager and documented responsibilities.',
    entity: 'Entity', assessor: 'Assessor', date: 'Date',
    scope: (c, k) => `${c} control${c === 1 ? '' : 's'}, ${k} check${k === 1 ? '' : 's'}`,
    phase: 'Phase', evidence: 'Evidence to collect',
    beyond: 'beyond the Annex',
    national: 'national obligation',
    colCheck: 'Check', colStatus: 'Met', colRef: 'Evidence reference',
    notOfficial: 'A readiness aid, not an official instrument. The authoritative text is the Annex as published in Kuwait Al Youm issue 1785.'
  },
  ar: {
    title: 'قائمة تحقق ميدانية للضوابط الوطنية الأساسية',
    forRole: (r) => (r.startsWith('ال') ? `لل${r.slice(2)}` : `لـ${r}`),
    intro: 'سطر لكل بند، بالترتيب الذي يقع فيه العمل. أشر إلى ما هو قائم اليوم وسجل موضع الدليل واحمل الباقي إلى التقييم.',
    assignment: 'توزيع المسؤوليات اجتهاد هذه الأداة، فالملحق لا يسمي أدوارا عدا ما يوجبه الضابط GOV-1 من تعيين مدير وتوثيق المسؤوليات.',
    entity: 'الجهة', assessor: 'المقيّم', date: 'التاريخ',
    scope: (c, k) => `${count(c, 'control')} و${count(k, 'check')}`,
    phase: 'المرحلة', evidence: 'الأدلة الواجب جمعها',
    beyond: 'زائد على الملحق',
    national: 'التزام وطني',
    colCheck: 'البند', colStatus: 'مستوفى', colRef: 'مرجع الدليل',
    notOfficial: 'أداة للاستعداد لا وثيقة رسمية، والنص المعتمد هو الملحق كما نشر في جريدة الكويت اليوم بالعدد 1785.'
  }
};

/*
 * Markdown, because it prints, pastes into anything, and survives being
 * carried around a building on a phone.
 */
export function renderChecklist(options = {}) {
  const ar = options.lang === 'ar';
  const t = ar ? T.ar : T.en;
  const list = buildChecklist(options);
  const L = (o, k) => (ar && o[`${k}Ar`] ? o[`${k}Ar`] : o[k]);
  const out = [];

  const roleName = options.role && getRole(options.role) ? L(getRole(options.role), 'name') : null;
  out.push(`# ${t.title}${roleName ? ` \u00b7 ${t.forRole(roleName)}` : ''}`);
  out.push('');
  out.push(`_${t.scope(list.controls, list.checks)}_`);
  out.push('');
  out.push(`| ${t.entity} | ${t.assessor} | ${t.date} |`);
  out.push('|---|---|---|');
  out.push(`| ${options.entity || '[ ]'} | [ ] | [ ] |`);
  out.push('');
  out.push(t.intro);
  out.push('');
  out.push(`> ${t.assignment}`);
  out.push('');

  for (const s of list.sections) {
    if (!options.role) {
      out.push(`## ${L(s.role, 'name')}`);
      out.push('');
      out.push(`_${L(s.role, 'blurb')}_`);
      out.push('');
    }
    for (const c of s.controls) {
      out.push(`### ${c.id} \u00b7 ${L(c, 'title')}`);
      const tags = [`${t.phase} ${c.phase}`];
      if (c.nationalObligation) tags.push(`**${t.national}**`);
      out.push('');
      out.push(`_${tags.join(' \u00b7 ')}_`);
      out.push('');
      const checks = ar ? c.checksAr : c.checks;
      checks.forEach((text, i) => {
        const beyond = (c.beyondAnnex || []).includes(i);
        out.push(`- [ ] ${text}${beyond ? ` _(${t.beyond})_` : ''}`);
      });
      out.push('');
      out.push(`**${t.evidence}**`);
      out.push('');
      for (const e of (ar ? c.evidenceAr : c.evidence)) out.push(`- [ ] ${e}  \u2014  ${t.colRef}: ______________`.replace('\u2014', '\u00b7'));
      out.push('');
    }
  }

  out.push('---');
  out.push('');
  out.push(`_${t.notOfficial}_`);
  out.push('');
  out.push(`_${ar ? REGULATION.decisionAr : REGULATION.decision}_`);
  out.push('');
  return out.join('\n');
}

export const CHECKLIST_STATS = Object.freeze({
  roles: ROLES.length,
  controls: ROLES.reduce((n, r) => n + r.controls.length, 0),
  checks: ROLES.reduce((n, r) => n + r.controls.reduce((s, id) => s + getControl(id).checks.length, 0), 0)
});
