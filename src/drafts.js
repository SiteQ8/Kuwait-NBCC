/*
 * Starter documents.
 *
 * GOV-2 names seven policies an entity must hold, GOV-5 wants a dated self
 * assessment record, and seventy of the hundred and sixty four evidence items
 * are a written document of some kind. Until now the toolkit could tell an
 * entity that all of them were missing and hand it nothing to begin from.
 *
 * The clauses in each draft are generated from the checks of the controls it
 * covers, so what the entity writes is exactly what the assessment will test.
 * A generic template downloaded from anywhere cannot make that promise.
 *
 * Nothing here is official. These are this project's own drafting, and every
 * document says so on its face.
 */

import { CONTROLS, getControl } from './catalog.js';
import { REGULATION } from './regulation.js';
import { count } from './messages.js';

export const DOCUMENTS = [
  {
    id: 'roles',
    title: 'Cybersecurity Roles and Responsibilities',
    titleAr: 'أدوار الأمن السيبراني ومسؤولياته',
    kind: 'policy',
    controls: ['GOV-1'],
    intro: 'Establishes who is accountable for cybersecurity in the entity and what each role owns.',
    introAr: 'تحدد هذه الوثيقة من يتحمل المساءلة عن الأمن السيبراني في الجهة وما يملكه كل دور.'
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    titleAr: 'سياسة الاستخدام المقبول',
    kind: 'policy',
    controls: ['PR-2.1', 'PR-4.1', 'PR-4.2', 'PR-3'],
    intro: 'Sets what staff may and may not do with entity systems, accounts, communication tools and removable media.',
    introAr: 'تبين ما يجوز للموظفين وما لا يجوز في استعمال أنظمة الجهة وحساباتها وأدوات تواصلها ووسائط تخزينها.'
  },
  {
    id: 'secure-configuration',
    title: 'Secure Configuration and Hardening Policy',
    titleAr: 'سياسة الإعدادات الآمنة والتحصين',
    kind: 'policy',
    controls: ['PR-1', 'PR-1.1', 'PR-1.2'],
    intro: 'Sets the hardened baseline every platform is built from and how it is kept current.',
    introAr: 'تضع الإعداد المرجعي المحصن الذي تبنى عليه كل منصة وكيفية إبقائه محدثا.'
  },
  {
    id: 'data-classification',
    title: 'Data Classification and Sovereignty Policy',
    titleAr: 'سياسة تصنيف البيانات وسيادتها',
    kind: 'policy',
    controls: ['GOV-3', 'CLD-12', 'CLD-13'],
    intro: 'Defines the classification tiers, how data is labelled, and where each tier may be held.',
    introAr: 'تحدد فئات التصنيف وكيفية وسم البيانات والمواضع التي يجوز أن تحفظ فيها كل فئة.',
    note: 'GOV-3 requires this document to be approved by senior management and submitted to NCSC under Decision No. 1 of 2025.',
    noteAr: 'يوجب الضابط GOV-3 اعتماد هذه الوثيقة من الإدارة العليا ورفعها إلى المركز وفق القرار رقم 1 لسنة 2025.'
  },
  {
    id: 'access-control',
    title: 'Access Control Policy',
    titleAr: 'سياسة التحكم في الوصول',
    kind: 'policy',
    controls: ['PR-2', 'PR-2.2', 'ID-3', 'PR-3.1'],
    intro: 'Governs identity, authentication, privilege and the review of both accounts and access.',
    introAr: 'تحكم الهوية والمصادقة والصلاحيات ومراجعة الحسابات والوصول.'
  },
  {
    id: 'backup-recovery',
    title: 'Backup, Recovery and Data Lifecycle Policy',
    titleAr: 'سياسة النسخ الاحتياطي والتعافي ودورة حياة البيانات',
    kind: 'policy',
    controls: ['PR-5', 'RC-1', 'RC-2'],
    intro: 'Sets what is backed up, where it is held, how restoration is proven, and when data is disposed of.',
    introAr: 'تحدد ما ينسخ احتياطيا وأين يحفظ وكيف تثبت الاستعادة ومتى تتلف البيانات.'
  },
  {
    id: 'incident-response',
    title: 'Incident Response Policy and Procedure',
    titleAr: 'سياسة الاستجابة للحوادث وإجراؤها',
    kind: 'policy',
    controls: ['RS-1', 'RS-2', 'DE-1'],
    intro: 'Sets how an incident is reported, who handles it, and when NCSC is notified.',
    introAr: 'تبين كيف يبلغ عن الحادث ومن يتولاه ومتى يخطر المركز.',
    note: 'RS-1 requires notification to NCSC through official channels and within the timeframes it sets.',
    noteAr: 'يوجب الضابط RS-1 إخطار المركز عبر القنوات الرسمية وضمن المهل التي يحددها.'
  },
  {
    id: 'third-party',
    title: 'Third Party and Cloud Security Policy',
    titleAr: 'سياسة أمن الأطراف الخارجية والحوسبة السحابية',
    kind: 'policy',
    controls: ['GOV-6', 'CLD-1', 'CLD-2', 'CLD-3', 'CLD-4', 'CLD-5', 'CLD-6', 'CLD-7'],
    intro: 'Governs how service providers are selected, contracted, monitored and exited.',
    introAr: 'تحكم كيفية اختيار مزودي الخدمة والتعاقد معهم ومتابعتهم وإنهاء التعاقد.'
  },
  {
    id: 'physical-security',
    title: 'Physical Protection of IT Assets Policy',
    titleAr: 'سياسة الحماية المادية للأصول التقنية',
    kind: 'policy',
    controls: ['PR-6'],
    intro: 'Sets how critical IT areas and portable equipment are physically protected.',
    introAr: 'تحدد كيفية حماية المناطق التقنية الحرجة والمعدات المحمولة ماديا.'
  },
  {
    id: 'exception-register',
    title: 'Policy Exception Register',
    titleAr: 'سجل الاستثناءات من السياسات',
    kind: 'register',
    controls: ['GOV-2'],
    intro: 'Records every deviation from policy with its risk acceptance and expiry, as Article 4 requires.',
    introAr: 'يسجل كل خروج عن السياسة مع قبول المخاطر وتاريخ الانتهاء، وفق ما توجبه المادة الرابعة.',
    columns: ['Reference', 'Control', 'Scope', 'Reason', 'Compensating control', 'Risk accepted by', 'Date accepted', 'Expiry', 'Status'],
    columnsAr: ['المرجع', 'الضابط', 'النطاق', 'السبب', 'الضابط التعويضي', 'قابل المخاطر', 'تاريخ القبول', 'تاريخ الانتهاء', 'الحالة']
  },
  {
    id: 'provider-register',
    title: 'Service Provider Register',
    titleAr: 'سجل مزودي الخدمة',
    kind: 'register',
    controls: ['GOV-6', 'ID-2'],
    intro: 'The inventory of service providers GOV-6 and ID-2 both require.',
    introAr: 'حصر مزودي الخدمة الذي يوجبه الضابطان GOV-6 وID-2.',
    columns: ['Provider', 'Service', 'Classification', 'Data classification handled', 'Criticality', 'Entity contact', 'Provider incident contact', 'Reporting timeframe', 'Last review'],
    columnsAr: ['المزود', 'الخدمة', 'التصنيف', 'تصنيف البيانات المعالجة', 'درجة الحرجية', 'جهة الاتصال في الجهة', 'جهة اتصال الحوادث لدى المزود', 'مهلة الإبلاغ', 'آخر مراجعة']
  },
  {
    id: 'self-assessment',
    title: 'Annual Self Assessment Record',
    titleAr: 'سجل التقييم الذاتي السنوي',
    kind: 'register',
    controls: ['GOV-5'],
    intro: 'The dated record GOV-5 requires, retained for three years and producible for NCSC on request.',
    introAr: 'السجل المؤرخ الذي يوجبه الضابط GOV-5، ويحفظ ثلاث سنوات ويقدم للمركز عند الطلب.',
    columns: ['Control', 'Status', 'Evidence reference', 'Gap', 'Action', 'Owner', 'Target date'],
    columnsAr: ['الضابط', 'الحالة', 'مرجع الدليل', 'الفجوة', 'الإجراء', 'المسؤول', 'التاريخ المستهدف'],
    note: 'GOV-5 requires this record to be retained for three years and produced for NCSC on request.',
    noteAr: 'يوجب الضابط GOV-5 حفظ هذا السجل ثلاث سنوات وتقديمه للمركز عند الطلب.'
  }
];

export function getDocument(id) {
  if (typeof id !== 'string') return undefined;
  return DOCUMENTS.find((d) => d.id === id.trim().toLowerCase());
}

export function validateDocuments() {
  const problems = [];
  const seen = new Set();
  for (const d of DOCUMENTS) {
    if (seen.has(d.id)) problems.push(`Duplicate document id ${d.id}.`);
    seen.add(d.id);
    for (const c of d.controls) {
      if (!getControl(c)) problems.push(`${d.id} references ${c}, which is not a control.`);
    }
    for (const field of ['title', 'titleAr', 'intro', 'introAr']) {
      if (!d[field]) problems.push(`${d.id} is missing ${field}.`);
    }
    if (d.kind === 'register' && (!d.columns || d.columns.length !== (d.columnsAr || []).length)) {
      problems.push(`${d.id} has mismatched register columns.`);
    }
  }
  // Every policy GOV-2 names by hand should have a draft behind it.
  for (const need of ['acceptable-use', 'secure-configuration', 'data-classification',
    'access-control', 'backup-recovery', 'incident-response', 'third-party']) {
    if (!getDocument(need)) problems.push(`GOV-2 names a policy with no draft: ${need}.`);
  }
  return problems;
}

const T = {
  en: {
    starter: 'Starter document',
    notOfficial: 'This is a drafting aid produced by the Kuwait NBCC Toolkit. It is not an official instrument and carries no standing with NCSC. Read it, cut what does not apply to the entity, and replace every bracketed placeholder before it is approved.',
    covers: 'Controls covered',
    generatedFrom: 'Every clause below is generated from the checks of those controls, so a document that satisfies this draft satisfies what the assessment tests.',
    entity: 'Entity',
    owner: 'Document owner',
    approved: 'Approved by',
    approvedDate: 'Date of approval',
    review: 'Next review',
    reviewNote: (y) => `GOV-2 asks for a review at least every ${y} years.`,
    version: 'Version',
    placeholder: 'name of the entity',
    clauses: 'Clauses',
    clauseNote: 'Each clause restates one check. Where a clause does not apply, record an exception in the exception register rather than deleting the clause.',
    evidence: 'Evidence this document supports',
    columnsHead: 'Columns',
    oneRow: 'One row per entry.',
    beyondNote: 'Marked clauses go beyond what the Annex states. They are sound practice this toolkit adds.',
    beyond: 'beyond the Annex',
    source: (d, g) => `Derived from Annex (1) to ${d}, published in ${g}.`
  },
  ar: {
    starter: 'وثيقة مبدئية',
    notOfficial: 'هذه مسودة أعدتها أدوات الضوابط الوطنية الأساسية للأمن السيبراني، وليست وثيقة رسمية ولا صفة لها لدى المركز. اقرأها واحذف ما لا ينطبق على الجهة واستبدل كل ما بين المعقوفين قبل اعتمادها.',
    covers: 'الضوابط المغطاة',
    generatedFrom: 'كل بند أدناه مولد من بنود التحقق الخاصة بتلك الضوابط، فالوثيقة التي تستوفي هذه المسودة تستوفي ما يختبره التقييم.',
    entity: 'الجهة',
    owner: 'مالك الوثيقة',
    approved: 'اعتمدها',
    approvedDate: 'تاريخ الاعتماد',
    review: 'المراجعة القادمة',
    reviewNote: () => 'يطلب الضابط GOV-2 مراجعة كل سنتين على الأقل.',
    version: 'الإصدار',
    placeholder: 'اسم الجهة',
    clauses: 'البنود',
    clauseNote: 'كل بند يعيد صياغة بند تحقق واحد، وحيثما لا ينطبق بند فسجل استثناء في سجل الاستثناءات بدل حذفه.',
    evidence: 'الأدلة التي تدعمها هذه الوثيقة',
    columnsHead: 'الأعمدة',
    oneRow: 'صف واحد لكل مدخل.',
    beyondNote: 'البنود الموسومة زائدة على ما ينص عليه الملحق، وهي ممارسة سليمة تضيفها الأداة.',
    beyond: 'زائد على الملحق',
    source: (d, g) => `مستمدة من الملحق الأول من ${d} المنشور في ${g}.`
  }
};

/*
 * Renders one document as Markdown, which is the format an entity can paste
 * into whatever document system it already runs.
 */
export function renderDraft(id, options = {}) {
  const doc = getDocument(id);
  if (!doc) return null;
  const ar = options.lang === 'ar';
  const t = ar ? T.ar : T.en;
  const entity = options.entity || `[${t.placeholder}]`;
  const L = (o, key) => (ar && o[`${key}Ar`] ? o[`${key}Ar`] : o[key]);

  const out = [];
  out.push(`# ${L(doc, 'title')}`);
  out.push('');
  out.push(`**${t.starter}** \u00b7 ${entity}`);
  out.push('');
  out.push(`> ${t.notOfficial}`);
  out.push('');
  out.push(L(doc, 'intro'));
  if (doc.note) {
    out.push('');
    out.push(`**${L(doc, 'note')}**`);
  }
  out.push('');
  out.push(`| | |`);
  out.push(`|---|---|`);
  out.push(`| ${t.entity} | ${entity} |`);
  out.push(`| ${t.owner} | [ ] |`);
  out.push(`| ${t.approved} | [ ] |`);
  out.push(`| ${t.approvedDate} | [ ] |`);
  out.push(`| ${t.review} | [ ] |`);
  out.push(`| ${t.version} | 0.1 |`);
  out.push('');
  out.push(`_${t.reviewNote(REGULATION.policyReviewYears || 2)}_`);
  out.push('');

  out.push(`## ${t.covers}`);
  out.push('');
  for (const cid of doc.controls) {
    const c = getControl(cid);
    out.push(`- **${cid}** ${L(c, 'title')}`);
  }
  out.push('');
  out.push(t.generatedFrom);
  out.push('');

  if (doc.kind === 'register') {
    const cols = ar ? doc.columnsAr : doc.columns;
    out.push(`## ${t.columnsHead}`);
    out.push('');
    out.push(`| ${cols.join(' | ')} |`);
    out.push(`|${cols.map(() => '---').join('|')}|`);
    out.push(`| ${cols.map(() => ' ').join(' | ')} |`);
    out.push('');
    out.push(`_${t.oneRow}_`);
    out.push('');
  }

  out.push(`## ${t.clauses}`);
  out.push('');
  out.push(`_${t.clauseNote}_`);
  out.push('');
  let n = 0;
  let anyBeyond = false;
  for (const cid of doc.controls) {
    const c = getControl(cid);
    out.push(`### ${cid} \u2014 ${L(c, 'title')}`.replace('\u2014', '\u00b7'));
    out.push('');
    const checks = ar ? c.checksAr : c.checks;
    checks.forEach((text, i) => {
      n += 1;
      const beyond = (c.beyondAnnex || []).includes(i);
      if (beyond) anyBeyond = true;
      out.push(`${n}. ${text}${beyond ? ` _(${t.beyond})_` : ''}`);
    });
    out.push('');
  }
  if (anyBeyond) {
    out.push(`_${t.beyondNote}_`);
    out.push('');
  }

  out.push(`## ${t.evidence}`);
  out.push('');
  for (const cid of doc.controls) {
    const c = getControl(cid);
    for (const e of (ar ? c.evidenceAr : c.evidence)) out.push(`- ${e} \u00b7 ${cid}`);
  }
  out.push('');
  out.push('---');
  out.push('');
  out.push(`_${t.source(ar ? REGULATION.decisionAr : REGULATION.decision,
    ar ? REGULATION.gazetteAr : REGULATION.gazette)}_`);
  out.push('');
  return out.join('\n');
}

export const DRAFT_STATS = Object.freeze({
  documents: DOCUMENTS.length,
  policies: DOCUMENTS.filter((d) => d.kind === 'policy').length,
  registers: DOCUMENTS.filter((d) => d.kind === 'register').length,
  controlsCovered: new Set(DOCUMENTS.flatMap((d) => d.controls)).size,
  clauses: DOCUMENTS.reduce(
    (sum, d) => sum + d.controls.reduce((s, c) => s + getControl(c).checks.length, 0), 0
  )
});
