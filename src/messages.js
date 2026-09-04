/*
 * Command line messages.
 *
 * Every string the tool prints lives here in both languages. Scattering
 * ternaries through the command bodies is how English labels ended up inside
 * Arabic output, so the rule is that no user facing literal is written inline.
 */


/*
 * Arabic counts change the noun after them. One takes the singular, two the
 * dual, three to ten a plural, and eleven upward a singular accusative. Writing
 * "5 يوما" the way a template does is wrong in every one of those cases but
 * the last, and a reader notices it immediately.
 */
const COUNTED = {
  day: ['يوم واحد', 'يومان', 'أيام', 'يوما'],
  workday: ['يوم عمل واحد', 'يوما عمل', 'أيام عمل', 'يوم عمل'],
  control: ['ضابط واحد', 'ضابطان', 'ضوابط', 'ضابطا'],
  check: ['بند واحد', 'بندان', 'بنود', 'بندا'],
  entity: ['جهة واحدة', 'جهتان', 'جهات', 'جهة'],
  assessment: ['تقييم واحد', 'تقييمان', 'تقييمات', 'تقييما'],
  year: ['سنة واحدة', 'سنتان', 'سنوات', 'سنة'],
  point: ['نقطة واحدة', 'نقطتان', 'نقاط', 'نقطة'],
  evidence: ['دليل واحد', 'دليلان', 'أدلة', 'دليلا'],
  issue: ['مسألة واحدة', 'مسألتان', 'مسائل', 'مسألة']
};

export function count(n, kind) {
  const [one, two, few, many] = COUNTED[kind];
  const c = Math.abs(Math.round(Number(n) || 0));
  if (c === 1) return one;
  if (c === 2) return two;
  if (c >= 3 && c <= 10) return `${c} ${few}`;
  return `${c} ${many}`;
}

export const MESSAGES = {
  en: {
    dir: 'ltr',

    // shared
    controls: 'controls', checksWord: 'checks', of: 'of', and: 'and',
    owner: 'Owner', unassigned: 'unassigned', none: 'none', more: 'more',
    days: 'days', dayShort: 'd', phase: 'Phase', effort: 'Effort', cadence: 'Cadence',
    band: 'Band', target: 'Target', notRecorded: 'not recorded',
    efforts: { low: 'low', medium: 'medium', high: 'high' },
    cadences: {},
    severities: { high: 'high', medium: 'medium', low: 'low' },

    // catalog
    catalogCount: (c, k) => `${c} controls, ${k} checks`,
    catalogHint: 'Run "nbcc show <id>" for the official minimum requirement.',

    // show
    purpose: 'Purpose', editorialNote: '(summary, not Annex text)',
    reqHead: 'Minimum requirement', reqOfficial: '(official text)',
    reqWorking: '(working translation)', officialHead: 'Official English text',
    checksHead: 'Checks', evidenceHead: 'Evidence to retain', mapsTo: 'Maps to',

    // search
    searchNone: (q) => `Nothing matched "${q}".`,
    searchFound: (n, q) => `${n} control(s) match "${q}"`,

    // deadline
    deadlineRemain: (n, d) => `${n} days remain before full compliance is due on ${d}.`,
    deadlineOver: (n, d) => `The deadline of ${d} passed ${n} days ago.`,
    deadlineElapsed: (p) => `${p}% of the window elapsed`,
    publishedIn: (p, g) => `Published ${p} in ${g}`,
    milestonesHead: 'Phase milestones',
    dueOn: 'due',

    // init
    initWrote: (p) => `Wrote ${p}`,
    initScope: (c, k) => `${c} applicable controls, ${k} checks to answer.`,
    initStatuses: 'Statuses: met, partial, gap, exception, na, unknown.',
    initNext: (p) => `Fill in the checks, then run "nbcc assess ${p}".`,

    // assess
    assessedOn: (n, d) => `${n} assessed ${d}`,
    implementation: 'Implementation', posture: 'Defensible posture', coverage: 'Coverage',
    scoreLine: (m, p, g, u, e) =>
      `${m} met \u00b7 ${p} partial \u00b7 ${g} gap \u00b7 ${u} unassessed \u00b7 ${e} excepted`,
    scopeLine: (i, o, k) => `${i} controls in scope, ${o} out of scope, ${k} checks counting toward the score`,
    byFunction: 'By function', metShort: 'met',
    controlsHead: 'Controls', findingsHead: 'Findings',
    findingsMore: (n) => `and ${n} more, see "nbcc report"`,
    evidenceHeadShort: 'Evidence',
    evidenceLocatable: (p, n) => `${p} of the ${n} artifacts are recorded and locatable`,
    evidenceClaims: 'control(s) scored met or partial with nothing recorded to show for them',
    evidenceHint: (p) => `Run "nbcc evidence ${p}" for the register.`,

    // plan
    planHead: 'Readiness plan', planEffort: (d, w) => `${d} person days of open work, ${w} working days remain`,
    planPhase: (n, d) => `due ${d}`, planOpen: 'open', planWaits: 'waits on', planUnblocks: 'unblocks',
    planNoWork: 'No open work. Every applicable control is fully met.',

    // evidence
    registerHead: 'Evidence register',
    registerSub: (n, y) => `${n} artifacts \u00b7 retain ${y} years \u00b7 produce for NCSC on request`,
    regRecorded: 'Recorded', regProducible: 'Producible',
    regCounts: (h, u, s, d, m) =>
      `${h} held \u00b7 ${u} with no location \u00b7 ${s} stale \u00b7 ${d} undated \u00b7 ${m} missing`,
    regRange: (a, b) => `Collected between ${a} and ${b}`,
    regNoLocation: 'no location recorded', regNoDate: 'no collection date',
    regNoRef: 'no reference', regOld: (n) => `${n} days old`,
    regAttention: 'Needs attention',
    regClaimsHead: 'Claimed but unevidenced',
    regClaimsSub: 'Controls scored as met or partial with nothing recorded to show for them.',
    regHint: 'Add --csv to export the register, --missing or --stale to narrow it.',

    // trend
    trendHead: 'Trend',
    trendSub: (n, a, b, d) => `${n} snapshots from ${a} to ${b}, ${d} days`,
    trendSeries: 'The series', trendRate: 'Rate', trendForecast: 'Forecast',
    trendForecastSub: (d, n) => `straight line to ${d}, ${n} days away`,
    trendMoved: (label, c, m) => `${label} moved ${c > 0 ? '+' : ''}${c} points, ${m} per month`,
    trendDrift: (p, dir, m) =>
      `The most recent interval ran ${p}% ${dir} at ${m} per month, so the straight line flatters or understates it`,
    faster: 'faster', slower: 'slower',
    trendReaches: (d, n) => `Implementation reaches 100% around ${d}, ${n} days before the deadline.`,
    trendStalled: (c, m) => `No forward rate to project from. At ${c}% today, closing the gap needs ${m} points per month.`,
    trendShort: (p, s) => `Projected ${p}% at the deadline, short by ${s} points.`,
    trendNeeded: (cur, need, mult) =>
      `Current pace is ${cur} per month. Landing on time needs ${need} per month, about ${mult} times the present rate.`,
    trendEvidence: (p) => `Evidence projects to ${p}%. A control you cannot show is a control you cannot defend.`,
    trendByFunction: 'By function', worstFirst: 'worst projection first',
    trendNow: 'now', trendProjected: 'projected', perMonth: '/mo',
    trendCaveat: 'A straight line through the snapshots. Compliance work rarely moves in one, so treat this as a direction, not a date.',
    verdicts: {
      'on track': 'on track', close: 'close, but short', behind: 'behind',
      stalled: 'stalled', regressing: 'going backwards', complete: 'complete'
    },
    trendDupes: (d) => `repeated snapshot date(s): ${d}`,
    trendSkipped: 'skipped',

    // portfolio
    portfolioHead: 'Portfolio',
    portfolioSub: (n, d, dl) => `${n} entities, ${d} days to ${dl}`,
    portfolioSeriesWarn: 'every file carries the same entity name.',
    portfolioSeriesHint: 'If these are one entity over time, "nbcc trend" is the command you want.',
    meanImpl: 'Mean implementation', meanEvidence: 'Mean evidence',
    portfolioRange: (lo, hi, sp, base, tot, hf, uc) =>
      `Range ${lo}% to ${hi}%, a spread of ${sp} points \u00b7 ${base} of ${tot} at the baseline` +
      ` \u00b7 ${hf} high findings \u00b7 ${uc} unevidenced claims`,
    entitiesHead: 'Entities', mostExposed: 'most exposed first',
    systemicHead: 'Systemic',
    systemicSub: (p) => `failing at ${p}% or more of the entities it applies to`,
    systemicNote: 'These are group problems with group fixes. Remediating them entity by entity wastes the year.',
    systemicNone: 'no control fails across most of the portfolio',
    isolatedHead: 'Isolated', isolatedSub: 'weak at some entities but not the group',
    portfolioDupes: (d) => `repeated entity name(s): ${d}`,
    portfolioHint: 'Add --csv for one row per entity, --systemic to hide the isolated list.',
    mean: 'mean', highShort: 'high',

    // crosswalk
    crosswalkHead: 'NBCC crosswalk', crosswalkTo: 'to NBCC',
    crosswalkOfficial: 'named in the Annex', crosswalkConvenience: 'convenience mapping',
    crosswalkReferenced: 'referenced', colControl: 'CONTROL',

    states: { met: 'met', partial: 'partial', gap: 'gap', 'covered-by-exception': 'covered by exception',
      unassessed: 'unassessed', 'not-applicable': 'not applicable', 'out-of-scope': 'out of scope' },
    passed: 'passed', startHere: 'Start here', startHereSub: 'low effort, open now',
    checksUnit: 'checks',
    beyond: 'beyond the Annex',
    beyondNote: 'Marked checks are sound practice this toolkit adds. The Annex does not state them.',

    warnIssues: (n) => `the assessment file has ${n} issue${n === 1 ? '' : 's'}:`,
    warnFile: (p, n) => `${p} has ${n} validation issue${n === 1 ? '' : 's'}`,
    warnWord: 'warning',
    reportLine: (name, pct, band) => `${name} \u00b7 ${pct}% implementation \u00b7 ${band}`,

    checklistHead: 'Field checklists',
    checklistSub: (r, c, k) => `${r} roles covering all ${c} controls and ${k} checks, with no control owned twice`,
    checklistHint: 'Run "nbcc checklist <role> --out sheet.md" for one sheet. Add --phase 1 to work a milestone, or --ar for Arabic.',
    checklistUnknown: (id) => `unknown role "${id}". Run "nbcc checklist" to list them.`,
    checklistWrote: (p, c, k) => `Wrote ${p} with ${c} control${c === 1 ? '' : 's'} and ${k} check${k === 1 ? '' : 's'}`,
    checklistEmpty: 'Nothing matches those filters.',

    nationalHead: 'National obligations',
    nationalSub: (n) => `${n} controls require an act toward a Kuwaiti authority or compliance with Kuwaiti law`,
    nationalNote: 'No international certification discharges these. An entity holding ISO 27001 or running CIS IG1 still has to do them.',
    nationalTag: 'national obligation',

    // drafts
    draftHead: 'Starter documents',
    draftSub: (n, c) => `${n} documents covering ${c} controls, clauses generated from the checks`,
    draftHint: 'Run "nbcc draft <id> --out policy.md" to write one. Add --ar for Arabic.',
    draftUnknown: (id) => `unknown document "${id}". Run "nbcc draft" to list them.`,
    draftWrote: (p, n) => `Wrote ${p} with ${n} clauses`,
    draftPolicy: 'policy', draftRegister: 'register',

    // doctor
    doctorHead: 'Self check', doctorOk: 'Catalog is internally consistent.',
    docControls: 'Controls', docChecks: 'Checks', docEvidence: 'Evidence items',
    docFunctions: 'Functions', docMilestones: 'Milestones',
    docProblems: (n) => `${n} catalog problem(s)`
  },

  ar: {
    dir: 'rtl',

    controls: 'ضابطا', checksWord: 'بندا', of: 'من', and: 'و',
    owner: 'المسؤول', unassigned: 'غير محدد', none: 'لا شيء', more: 'أخرى',
    days: 'يوما', dayShort: 'ي', phase: 'المرحلة', effort: 'الجهد', cadence: 'الدورية',
    band: 'المستوى', target: 'التاريخ المستهدف', notRecorded: 'غير مسجل',
    efforts: { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' },
    cadences: {
      annual: 'سنويا', biennial: 'كل سنتين', 'per hire': 'عند كل تعيين', weekly: 'أسبوعيا',
      monthly: 'شهريا', quarterly: 'ربع سنوي', continuous: 'مستمر',
      'per incident': 'عند كل حادث', 'per engagement': 'عند كل تعاقد'
    },
    severities: { high: 'مرتفعة', medium: 'متوسطة', low: 'منخفضة' },

    catalogCount: (c, k) => `${count(c, 'control')} و${count(k, 'check')} للتحقق`,
    catalogHint: 'استخدم "nbcc show <id> --ar" لعرض الحد الأدنى المطلوب.',

    purpose: 'الغرض', editorialNote: '(تلخيص، وليس من نص الملحق)',
    reqHead: 'الحد الأدنى المطلوب', reqOfficial: '(النص الرسمي)',
    reqWorking: '(ترجمة عاملة)', officialHead: 'النص الرسمي بالإنجليزية',
    checksHead: 'بنود التحقق', evidenceHead: 'الأدلة الواجب حفظها', mapsTo: 'المواءمة مع الأطر',

    searchNone: (q) => `لا نتائج مطابقة لـ "${q}".`,
    searchFound: (n, q) => `${n} من الضوابط تطابق "${q}"`,

    deadlineRemain: (n, d) => `بقي ${count(n, 'day')} على استحقاق الامتثال الكامل في ${d}.`,
    deadlineOver: (n, d) => `مضى ${count(n, 'day')} على الموعد النهائي ${d}.`,
    deadlineElapsed: (p) => `انقضى ${p}٪ من المدة`,
    publishedIn: (p, g) => `نشر في ${p} في ${g}`,
    milestonesHead: 'مراحل المهلة',
    dueOn: 'يستحق',

    initWrote: (p) => `أنشئ ${p}`,
    initScope: (c, k) => `${count(c, 'control')} منطبقة، و${count(k, 'check')} للإجابة عنها.`,
    initStatuses: 'الحالات: met و partial و gap و exception و na و unknown.',
    initNext: (p) => `أجب عن البنود ثم شغل "nbcc assess ${p}".`,

    assessedOn: (n, d) => `${n} قيمت بتاريخ ${d}`,
    implementation: 'نسبة التطبيق', posture: 'الوضع القابل للإثبات', coverage: 'نسبة التغطية',
    scoreLine: (m, p, g, u, e) =>
      `${m} مستوف \u00b7 ${p} جزئي \u00b7 ${g} فجوة \u00b7 ${u} غير مقيم \u00b7 ${e} مستثنى`,
    scopeLine: (i, o, k) => `${count(i, 'control')} ضمن النطاق، و${o} خارجه، و${count(k, 'check')} محسوبا في النتيجة`,
    byFunction: 'بحسب الوظيفة', metShort: 'مستوف',
    controlsHead: 'الضوابط', findingsHead: 'الملاحظات',
    findingsMore: (n) => `و${n} أخرى، انظر "nbcc report"`,
    evidenceHeadShort: 'الأدلة',
    evidenceLocatable: (p, n) => `${p} من الأدلة ${n} مسجلة ويمكن تقديمها`,
    evidenceClaims: 'من الضوابط قيمت مستوفاة أو جزئية دون ما يثبتها',
    evidenceHint: (p) => `شغل "nbcc evidence ${p}" لعرض السجل.`,

    planHead: 'خطة الجاهزية', planEffort: (d, w) => `${count(d, 'workday')} مفتوحة، وبقي ${count(w, 'workday')}`,
    planPhase: (n, d) => `يستحق ${d}`, planOpen: 'مفتوح', planWaits: 'ينتظر', planUnblocks: 'يفتح الطريق أمام',
    planNoWork: 'لا عمل مفتوح، فكل ضابط منطبق مستوفى بالكامل.',

    registerHead: 'سجل الأدلة',
    registerSub: (n, y) => `${count(n, 'evidence')} \u00b7 تحفظ ${count(y, 'year')} \u00b7 تقدم للمركز عند الطلب`,
    regRecorded: 'مسجل', regProducible: 'يمكن تقديمه',
    regCounts: (h, u, s, d, m) =>
      `${h} محفوظ \u00b7 ${u} دون موضع \u00b7 ${s} متقادم \u00b7 ${d} دون تاريخ \u00b7 ${m} مفقود`,
    regRange: (a, b) => `جمعت بين ${a} و${b}`,
    regNoLocation: 'لم يسجل موضعه', regNoDate: 'دون تاريخ جمع',
    regNoRef: 'دون مرجع', regOld: (n) => `مضى عليه ${count(n, 'day')}`,
    regAttention: 'يستدعي المعالجة',
    regClaimsHead: 'ادعي استيفاؤها دون دليل',
    regClaimsSub: 'ضوابط قيمت مستوفاة أو جزئية دون ما يثبتها.',
    regHint: 'أضف ‎--csv‎ لتصدير السجل، أو ‎--missing‎ أو ‎--stale‎ لتضييقه.',

    trendHead: 'الاتجاه',
    trendSub: (n, a, b, d) => `${count(n, 'assessment')} من ${a} إلى ${b}، ${count(d, 'day')}`,
    trendSeries: 'سلسلة التقييمات', trendRate: 'المعدل', trendForecast: 'التوقع',
    trendForecastSub: (d, n) => `خط مستقيم حتى ${d}، على بعد ${count(n, 'day')}`,
    trendMoved: (label, c, m) => `تحرك ${label} بمقدار ${c > 0 ? '+' : ''}${c} نقطة، أي ${m} شهريا`,
    trendDrift: (p, dir, m) =>
      `سارت الفترة الأخيرة ${p}٪ ${dir} بمعدل ${m} شهريا، فالخط المستقيم يجمل الصورة أو يبخسها`,
    faster: 'أسرع', slower: 'أبطأ',
    trendReaches: (d, n) => `تبلغ نسبة التطبيق 100٪ نحو ${d}، أي قبل الموعد النهائي بـ ${count(n, 'day')}.`,
    trendStalled: (c, m) => `لا معدل تقدم يبنى عليه توقع، وعند ${c}٪ اليوم يحتاج سد الفجوة ${count(m, 'point')} شهريا.`,
    trendShort: (p, s) => `التوقع ${p}٪ عند الموعد النهائي، بعجز قدره ${count(s, 'point')}.`,
    trendNeeded: (cur, need, mult) =>
      `المعدل الحالي ${cur} شهريا، والوصول في الموعد يحتاج ${need} شهريا، أي نحو ${mult} أضعاف المعدل الحالي.`,
    trendEvidence: (p) => `يتوقع أن تبلغ الأدلة ${p}٪، والضابط الذي لا يمكن إثباته لا يمكن الدفاع عنه.`,
    trendByFunction: 'بحسب الوظيفة', worstFirst: 'الأدنى توقعا أولا',
    trendNow: 'الآن', trendProjected: 'متوقع', perMonth: '/شهر',
    trendCaveat: 'هذا خط مستقيم يمر بالتقييمات، وعمل الامتثال نادرا ما يسير في خط واحد، فاقرأه اتجاها لا تاريخا.',
    verdicts: {
      'on track': 'يسير على المسار', close: 'يقارب ولا يبلغ', behind: 'متأخر',
      stalled: 'متوقف', regressing: 'يتراجع', complete: 'مكتمل'
    },
    trendDupes: (d) => `تواريخ لقطات مكررة: ${d}`,
    trendSkipped: 'تخطي',

    portfolioHead: 'نظرة المجموعة',
    portfolioSub: (n, d, dl) => `${count(n, 'entity')}، و${count(d, 'day')} حتى ${dl}`,
    portfolioSeriesWarn: 'كل الملفات تحمل اسم الجهة نفسه.',
    portfolioSeriesHint: 'إن كانت هذه جهة واحدة عبر الزمن، فالأمر المطلوب هو "nbcc trend".',
    meanImpl: 'متوسط التطبيق', meanEvidence: 'متوسط الأدلة',
    portfolioRange: (lo, hi, sp, base, tot, hf, uc) =>
      `المدى من ${lo}٪ إلى ${hi}٪ بفارق ${count(sp, 'point')} \u00b7 ${base} من ${tot} بلغت الحد الأدنى` +
      ` \u00b7 ${hf} ملاحظة مرتفعة \u00b7 ${uc} دعوى دون دليل`,
    entitiesHead: 'الجهات', mostExposed: 'الأكثر انكشافا أولا',
    systemicHead: 'ثغرات مشتركة',
    systemicSub: (p) => `تخفق لدى ${p}٪ أو أكثر من الجهات التي تنطبق عليها`,
    systemicNote: 'هذه مشكلات على مستوى المجموعة وحلها يكون على مستوى المجموعة، ومعالجتها جهة جهة تهدر السنة.',
    systemicNone: 'لا ضابط يخفق لدى معظم الجهات',
    isolatedHead: 'ثغرات منفردة', isolatedSub: 'ضعيفة لدى بعض الجهات دون المجموعة',
    portfolioDupes: (d) => `أسماء جهات مكررة: ${d}`,
    portfolioHint: 'أضف ‎--csv‎ لصف لكل جهة، أو ‎--systemic‎ لإخفاء قائمة الثغرات المنفردة.',
    mean: 'متوسط', highShort: 'مرتفعة',

    crosswalkHead: 'مواءمة الضوابط الوطنية', crosswalkTo: 'مقابل الضوابط الوطنية',
    crosswalkOfficial: 'منصوص عليه في الملحق', crosswalkConvenience: 'مواءمة تيسيرية',
    crosswalkReferenced: 'مرجعا', colControl: 'الضابط',

    states: { met: 'مستوف', partial: 'جزئي', gap: 'فجوة', 'covered-by-exception': 'مغطى باستثناء',
      unassessed: 'غير مقيم', 'not-applicable': 'لا ينطبق', 'out-of-scope': 'خارج النطاق' },
    passed: 'انقضت', startHere: 'ابدأ من هنا', startHereSub: 'جهد منخفض ومفتوح الآن',
    checksUnit: 'بندا',
    beyond: 'زائد على الملحق',
    beyondNote: 'البنود الموسومة ممارسة سليمة تضيفها الأداة، ولا ينص عليها الملحق.',

    warnIssues: (n) => `في ملف التقييم ${count(n, 'issue')}:`,
    warnFile: (p, n) => `في ${p} ${count(n, 'issue')} في التحقق`,
    warnWord: 'تنبيه',
    reportLine: (name, pct, band) => `${name} \u00b7 نسبة التطبيق ${pct}٪ \u00b7 ${band}`,

    checklistHead: 'قوائم التحقق الميدانية',
    checklistSub: (r, c, k) => `${r} أدوار تغطي الضوابط الـ${c} كلها و${k} بندا، دون أن يملك ضابط واحد دوران`,
    checklistHint: 'شغل "nbcc checklist <role> --out sheet.md" لورقة واحدة، وأضف ‎--phase 1‎ للعمل على مرحلة أو ‎--ar‎ للعربية.',
    checklistUnknown: (id) => `دور غير معروف "${id}". شغل "nbcc checklist" لعرض القائمة.`,
    checklistWrote: (p, c, k) => `أنشئ ${p} بـ ${count(c, 'control')} و${count(k, 'check')}`,
    checklistEmpty: 'لا شيء يطابق هذه المرشحات.',

    nationalHead: 'الالتزامات الوطنية',
    nationalSub: (n) => `${n} ضوابط تستلزم فعلا تجاه جهة كويتية أو امتثالا لقانون كويتي`,
    nationalNote: 'لا تغني عنها أي شهادة دولية، فالجهة الحاصلة على الأيزو 27001 أو المطبقة لضوابط CIS تظل ملزمة بها.',
    nationalTag: 'التزام وطني',

    draftHead: 'الوثائق المبدئية',
    draftSub: (n, c) => `${n} وثيقة تغطي ${c} ضابطا، وبنودها مولدة من بنود التحقق`,
    draftHint: 'شغل "nbcc draft <id> --out policy.md" لكتابة إحداها، وأضف ‎--ar‎ للعربية.',
    draftUnknown: (id) => `وثيقة غير معروفة "${id}". شغل "nbcc draft" لعرض القائمة.`,
    draftWrote: (p, n) => `أنشئ ${p} بـ ${n} بندا`,
    draftPolicy: 'سياسة', draftRegister: 'سجل',

    doctorHead: 'الفحص الذاتي', doctorOk: 'فهرس الضوابط متسق داخليا.',
    docControls: 'الضوابط', docChecks: 'بنود التحقق', docEvidence: 'عناصر الأدلة',
    docFunctions: 'الوظائف', docMilestones: 'المراحل',
    docProblems: (n) => `${n} من مشكلات فهرس الضوابط`
  }
};
