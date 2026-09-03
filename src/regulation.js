/*
 * Kuwait NBCC control catalog.
 *
 * Source of truth: Annex (1) to Decision No. 2 of 2026 of the National Cyber
 * Security Center of the State of Kuwait, titled "Kuwait National Basic
 * Cybersecurity Controls", published in Kuwait Al Youm issue 1785, year 72,
 * dated 5 April 2026.
 *
 * The `requirement` field of every control quotes the official English text of
 * the Annex, which Article 6 of the Decision designates as the authoritative
 * technical text. The `checks` array is an operational decomposition of that
 * text into atomic, individually verifiable statements. The decomposition is a
 * reading aid produced by this project and carries no official standing.
 */

export const REGULATION = {
  id: 'KW-NBCC-2026',
  decision: 'Decision No. 2 of 2026',
  decisionAr: 'قرار رقم (2) لسنة 2026',
  title: 'Kuwait National Basic Cybersecurity Controls',
  titleAr: 'الضوابط الوطنية الأساسية للأمن السيبراني',
  shortName: 'NBCC',
  authority: 'National Cyber Security Center (NCSC)',
  authorityAr: 'المركز الوطني للأمن السيبراني',
  gazette: 'Kuwait Al Youm, issue 1785, year 72',
  signedOn: '2026-03-31',
  publishedOn: '2026-04-05',
  complianceWindowMonths: 18,
  deadline: '2027-10-05',
  enablingDecree: 'Amiri Decree No. 37 of 2022',
  relatedInstruments: [
    'Decision No. 35 of 2023 (National Cybersecurity Governance Framework)',
    'Decision No. 1 of 2025 (National Data Classification Framework)'
  ],
  alignedWith: ['NIST CSF 2.0', 'CIS Controls v8.1 Implementation Group 1'],
  selfAssessmentCadenceMonths: 12,
  recordRetentionYears: 3
};

export const FUNCTIONS = [
  {
    id: 'GOV',
    name: 'Govern',
    nameAr: 'الحوكمة',
    blurb: 'Establish and monitor the cybersecurity risk management strategy, expectations and policy.',
    blurbAr: 'وضع استراتيجية إدارة مخاطر الأمن السيبراني والتطلعات والسياسات ومتابعتها.',
    color: '#7c5cff'
  },
  {
    id: 'ID',
    name: 'Identify',
    nameAr: 'التحديد',
    blurb: 'Determine the current cybersecurity risk to the entity.',
    blurbAr: 'تحديد مخاطر الأمن السيبراني الحالية على الجهة.',
    color: '#0ea5a4'
  },
  {
    id: 'PR',
    name: 'Protect',
    nameAr: 'الحماية',
    blurb: 'Prevent or reduce cybersecurity risks.',
    blurbAr: 'منع مخاطر الأمن السيبراني أو الحد منها.',
    color: '#2563eb'
  },
  {
    id: 'DE',
    name: 'Detect',
    nameAr: 'الكشف',
    blurb: 'Find and analyze possible cybersecurity attacks and compromise.',
    blurbAr: 'اكتشاف الهجمات السيبرانية المحتملة وحالات الاختراق وتحليلها.',
    color: '#d97706'
  },
  {
    id: 'RS',
    name: 'Respond',
    nameAr: 'الاستجابة',
    blurb: 'Take action regarding a detected cybersecurity incident.',
    blurbAr: 'اتخاذ الإجراءات اللازمة حيال أي حادث سيبراني مكتشف.',
    color: '#dc2626'
  },
  {
    id: 'RC',
    name: 'Recover',
    nameAr: 'التعافي',
    blurb: 'Restore assets and operations impacted by a cybersecurity incident.',
    blurbAr: 'استعادة الأصول والعمليات المتأثرة بالحادث السيبراني.',
    color: '#059669'
  },
  {
    id: 'CLD',
    name: 'Cloud',
    nameAr: 'الحوسبة السحابية',
    blurb: 'Appendix A minimum controls for entities consuming public cloud services.',
    blurbAr: 'الحد الأدنى من ضوابط الملحق أ للجهات التي تستخدم خدمات الحوسبة السحابية العامة.',
    color: '#0891b2'
  }
];

