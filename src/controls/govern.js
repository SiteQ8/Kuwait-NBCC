// GOVERN (GOV) controls of the Kuwait NBCC baseline.

/*
 * Control shape
 *   id            official control identifier
 *   fn            NIST CSF function grouping used by the Annex
 *   title         official English control title
 *   titleAr       Arabic rendering of the title
 *   purpose       the "Purpose / Description" cell, where the Annex has one
 *   purposeSource "annex" where the Annex prints a purpose, "editorial" where
 *                 it does not. Appendix A tables carry only Control ID, Control
 *                 Title and Minimum Requirement, so every cloud purpose here is
 *                 this project's own summary and must never be shown as official.
 *   purposeAr     Arabic rendering of the purpose
 *   requirement   official "Minimum Requirement" cell, quoted
 *   checks        atomic verifiable statements derived from the requirement
 *   evidence      artifacts an assessor would reasonably expect to see
 *   cadence       review or repeat frequency implied by the requirement
 *   effort        rough implementation weight, one of low medium high
 *   phase         suggested readiness phase, 1 to 3
 *   appliesWhen   profile predicate keys, all must hold for the control to apply
 *   crosswalk     mappings to CSF 2.0 subcategories and CIS v8.1 safeguards
 */

export const GOVERN = [
  {
    id: 'GOV-1',
    fn: 'GOV',
    title: 'Governance & Roles',
    titleAr: 'الحوكمة والأدوار',
    purpose: 'Establish clear accountability for cybersecurity.',
    purposeAr: 'ترسيخ مساءلة واضحة عن الأمن السيبراني.',
    purposeSource: 'annex',
    requirement:
      'The entity MUST designate an employee at manager level or above with overall responsibility for cybersecurity. Define and document roles and responsibilities for information security, IT operations, risk management, data classification, and incident response. Review and update this structure at least annually or when major organizational changes occur.',
        requirementAr:
      'على الجهة أن تعين موظفا بدرجة مدير فما فوق يتولى المسؤولية الشاملة عن الأمن السيبراني، وأن تحدد وتوثق الأدوار والمسؤوليات الخاصة بأمن المعلومات وعمليات تقنية المعلومات وإدارة المخاطر وتصنيف البيانات والاستجابة للحوادث، ثم تراجع هذا الهيكل وتحدثه سنويا على الأقل أو عند وقوع تغييرات تنظيمية جوهرية.',
checks: [
      'An employee at manager level or above is formally designated with overall responsibility for cybersecurity.',
      'The designation is documented and traceable to a signed appointment or equivalent record.',
      'Roles and responsibilities are documented for information security.',
      'Roles and responsibilities are documented for IT operations.',
      'Roles and responsibilities are documented for risk management.',
      'Roles and responsibilities are documented for data classification.',
      'Roles and responsibilities are documented for incident response.',
      'The role structure is reviewed and updated at least annually.',
      'The role structure is reviewed after any major organizational change.'
    ],
    checksAr: [
      'يعين موظف بدرجة مدير فما فوق تعيينا رسميا ليتولى المسؤولية الشاملة عن الأمن السيبراني.',
      'التعيين موثق ويمكن تتبعه إلى كتاب تكليف موقع أو ما يقوم مقامه.',
      'الأدوار والمسؤوليات موثقة لأمن المعلومات.',
      'الأدوار والمسؤوليات موثقة لعمليات تقنية المعلومات.',
      'الأدوار والمسؤوليات موثقة لإدارة المخاطر.',
      'الأدوار والمسؤوليات موثقة لتصنيف البيانات.',
      'الأدوار والمسؤوليات موثقة للاستجابة للحوادث.',
      'هيكل الأدوار يراجع ويحدث سنويا على الأقل.',
      'هيكل الأدوار يراجع عقب أي تغيير تنظيمي جوهري.'
    ],
    evidence: [
      'Signed appointment letter or decision naming the cybersecurity lead',
      'RACI matrix or roles and responsibilities document',
      'Organizational chart showing the reporting line of the cybersecurity function',
      'Dated record of the most recent annual review'
    ],
    evidenceAr: [
      'كتاب تكليف أو قرار موقع يسمي المسؤول عن الأمن السيبراني',
      'مصفوفة مسؤوليات أو وثيقة أدوار ومسؤوليات',
      'هيكل تنظيمي يبين خط ارتباط وظيفة الأمن السيبراني',
      'محضر مؤرخ لآخر مراجعة سنوية'
    ],
    cadence: 'annual',
    effort: 'low',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['GV.RR-01', 'GV.RR-02'], cis: ['17.1'] }
  },
  {
    id: 'GOV-2',
    fn: 'GOV',
    title: 'Policies & Exception Management',
    titleAr: 'السياسات وإدارة الاستثناءات',
    purpose: 'Ensure behavior and decisions are guided by documented, approved rules.',
    purposeAr: 'ضمان استناد السلوكيات والقرارات إلى قواعد موثقة ومعتمدة.',
    purposeSource: 'annex',
    requirement:
      'Maintain core written policies that, at minimum, cover: acceptable use, Secure Configuration, data classification, access control, backup & recovery, incident response, and third-party / service provider security. Policies SHOULD be approved by management and reviewed at least every two years. Any deviations MUST follow a simple exception process with documented risk acceptance and an expiry date.',
        requirementAr:
      'تحفظ الجهة سياسات مكتوبة أساسية تغطي كحد أدنى الاستخدام المقبول والتهيئة الآمنة وتصنيف البيانات والتحكم في الوصول والنسخ الاحتياطي والاستعادة والاستجابة للحوادث وأمن الأطراف الثالثة ومزودي الخدمة، وينبغي أن تعتمد هذه السياسات من الإدارة وأن تراجع كل سنتين على الأقل، أما أي خروج عنها فيجب أن يمر بآلية استثناء مبسطة تتضمن قبولا موثقا للمخاطر وتاريخ انتهاء.',
checks: [
      'A written acceptable use policy exists.',
      'A written secure configuration policy exists.',
      'A written data classification policy exists.',
      'A written access control policy exists.',
      'A written backup and recovery policy exists.',
      'A written incident response policy exists.',
      'A written third party and service provider security policy exists.',
      'Policies are approved by management.',
      'Policies are reviewed at least every two years.',
      'A documented exception process exists for deviations from policy.',
      'Every recorded exception carries a documented risk acceptance.',
      'Every recorded exception carries an expiry date.'
    ],
    checksAr: [
      'توجد سياسة مكتوبة للاستخدام المقبول.',
      'توجد سياسة مكتوبة للتهيئة الآمنة.',
      'توجد سياسة مكتوبة لتصنيف البيانات.',
      'توجد سياسة مكتوبة للتحكم في الوصول.',
      'توجد سياسة مكتوبة للنسخ الاحتياطي والاستعادة.',
      'توجد سياسة مكتوبة للاستجابة للحوادث.',
      'توجد سياسة مكتوبة لأمن الأطراف الثالثة ومزودي الخدمة.',
      'السياسات معتمدة من الإدارة.',
      'السياسات تراجع كل سنتين على الأقل.',
      'توجد آلية موثقة للاستثناء من السياسات.',
      'كل استثناء مسجل يحمل قبولا موثقا للمخاطر.',
      'كل استثناء مسجل يحمل تاريخ انتهاء.'
    ],
    evidence: [
      'Policy set with version history and approval signatures',
      'Policy review calendar showing the two year cycle',
      'Exception register listing scope, owner, risk acceptance and expiry',
      'Compensating control notes attached to open exceptions'
    ],
    evidenceAr: [
      'حزمة السياسات مع سجل الإصدارات وتواقيع الاعتماد',
      'جدول مراجعة السياسات يبين دورة السنتين',
      'سجل الاستثناءات يبين النطاق والمسؤول وقبول المخاطر وتاريخ الانتهاء',
      'ملاحظات الضوابط التعويضية المرفقة بالاستثناءات المفتوحة'
    ],
    cadence: 'biennial',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['GV.PO-01', 'GV.PO-02'], cis: ['4.1', '14.1'] }
  },
  {
    id: 'GOV-3',
    fn: 'GOV',
    title: 'Data Classification & Sovereignty',
    titleAr: 'تصنيف البيانات والسيادة عليها',
    purpose: 'Ensure data is handled according to its sensitivity and legal requirements.',
    purposeAr: 'ضمان التعامل مع البيانات وفق درجة حساسيتها ومتطلباتها القانونية.',
    purposeSource: 'annex',
    requirement:
      'Implement a data classification program aligned with the National Data Classification Framework, using at least Sensitive, Restricted, and Public categories, with clear criteria and examples. Issue a Data Classification Policy/Document approved by senior management and submitted to NCSC for approval, in accordance with Decision No. 1 of 2025. Tag or label data (and related systems/records) with its classification and ensure protection measures increase with sensitivity (for example: stronger access controls and encryption for Sensitive data). Storing or processing Sensitive data outside Kuwait MUST follow the national approval process and receive explicit NCSC approval before use (per applicable regulations).',
        requirementAr:
      'تطبق الجهة برنامجا لتصنيف البيانات موائما للإطار الوطني لتصنيف البيانات يستخدم فئات حساس ومقيد وعام على الأقل بمعايير وأمثلة واضحة، وتصدر سياسة أو وثيقة لتصنيف البيانات معتمدة من الإدارة العليا ومرفوعة إلى المركز لاعتمادها وفقا للقرار رقم 1 لسنة 2025، ثم توسم البيانات والأنظمة والسجلات المرتبطة بها بتصنيفها وتضمن تصاعد تدابير الحماية مع درجة الحساسية، ومن ذلك مثلا ضوابط وصول وتشفير أقوى للبيانات الحساسة، أما حفظ البيانات الحساسة أو معالجتها خارج الكويت فيجب أن يتبع آلية الاعتماد الوطنية وأن يحصل على موافقة صريحة من المركز قبل الاستخدام وفق اللوائح المعمول بها.',
checks: [
      'A data classification program is implemented and aligned with the National Data Classification Framework.',
      'The scheme uses at least the Sensitive, Restricted and Public categories.',
      'Classification criteria and worked examples are documented.',
      'A Data Classification Policy or Document is approved by senior management.',
      'The Data Classification Document has been submitted to NCSC for approval under Decision No. 1 of 2025.',
      'Data is tagged or labelled with its classification.',
      'Related systems and records carry the classification of the data they hold.',
      'Protection measures demonstrably increase with sensitivity.',
      'Sensitive data receives stronger access controls and encryption than lower tiers.',
      'Any storage or processing of Sensitive data outside Kuwait has explicit prior NCSC approval.'
    ],
    checksAr: [
      'يطبق برنامج لتصنيف البيانات موائم للإطار الوطني لتصنيف البيانات.',
      'التصنيف يستخدم فئات حساس ومقيد وعام على الأقل.',
      'معايير التصنيف وأمثلته العملية موثقة.',
      'سياسة أو وثيقة تصنيف البيانات معتمدة من الإدارة العليا.',
      'وثيقة تصنيف البيانات مرفوعة إلى المركز لاعتمادها وفق القرار رقم 1 لسنة 2025.',
      'البيانات موسومة بتصنيفها.',
      'الأنظمة والسجلات المرتبطة تحمل تصنيف البيانات التي تحتويها.',
      'تدابير الحماية تتصاعد بوضوح مع درجة الحساسية.',
      'البيانات الحساسة تحظى بضوابط وصول وتشفير أقوى من الفئات الأدنى.',
      'أي حفظ أو معالجة للبيانات الحساسة خارج الكويت له موافقة مسبقة صريحة من المركز.'
    ],
    evidence: [
      'Approved Data Classification Policy with senior management signature',
      'Proof of submission to NCSC and any approval response',
      'Sample labelled records, file shares or database catalogues',
      'Control matrix showing measures applied per classification tier',
      'Approval file for every offshore location holding Sensitive data'
    ],
    evidenceAr: [
      'سياسة تصنيف البيانات المعتمدة بتوقيع الإدارة العليا',
      'ما يثبت الرفع إلى المركز وأي رد بالاعتماد',
      'عينات من سجلات أو مجلدات أو فهارس قواعد بيانات موسومة',
      'مصفوفة ضوابط تبين التدابير المطبقة لكل فئة تصنيف',
      'ملف الموافقة لكل موقع خارجي يحتفظ ببيانات حساسة'
    ],
    cadence: 'annual',
    effort: 'high',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['ID.AM-07', 'GV.PO-01'], cis: ['3.1', '3.2', '3.7'] }
  },
  {
    id: 'GOV-4',
    fn: 'GOV',
    title: 'Kuwaitization & Vetting for Cyber Roles',
    titleAr: 'التكويت والتحري في الأدوار السيبرانية',
    purpose: 'Support national capacity building and reduce insider risk in critical cyber roles.',
    purposeAr: 'دعم بناء القدرات الوطنية والحد من مخاطر التهديد الداخلي في الأدوار السيبرانية الحرجة.',
    purposeSource: 'annex',
    requirement:
      'For key cybersecurity roles (e.g., SOC analysts, administrators, incident responders), prioritize qualified Kuwaiti nationals where feasible and consistent with national HR frameworks and local laws and regulations. For staff in such sensitive roles, perform basic pre-employment screening (e.g., identity verification, employment history, conflict-of-interest checks) in line with applicable laws and HR policies. Maintain a simple list of designated "sensitive cyber roles" and ensure screening is documented.',
        requirementAr:
      'في الأدوار السيبرانية الرئيسية، ومنها مثلا محللو مركز العمليات الأمنية ومسؤولو الأنظمة والمستجيبون للحوادث، تعطى الأولوية للكوادر الكويتية المؤهلة متى كان ذلك ممكنا وبما يتسق مع أطر الموارد البشرية الوطنية والقوانين واللوائح المحلية، ويجرى للعاملين في هذه الأدوار الحساسة تحر أساسي قبل التعيين يشمل مثلا التحقق من الهوية والتاريخ الوظيفي وتعارض المصالح بما يتفق مع القوانين وسياسات الموارد البشرية السارية، كما تحفظ قائمة مبسطة بالأدوار السيبرانية الحساسة المحددة مع توثيق عمليات التحري.',
checks: [
      'Qualified Kuwaiti nationals are prioritized for key cybersecurity roles where feasible.',
      'The prioritization approach is consistent with national HR frameworks and local law.',
      'A list of designated sensitive cyber roles is maintained.',
      'Identity verification is performed before hire into sensitive cyber roles.',
      'Employment history is verified before hire into sensitive cyber roles.',
      'Conflict of interest checks are performed before hire into sensitive cyber roles.',
      'Screening outcomes are documented and retained.'
    ],
    checksAr: [
      'الكوادر الكويتية المؤهلة تعطى الأولوية في الأدوار السيبرانية الرئيسية متى أمكن.',
      'نهج الأولوية متسق مع أطر الموارد البشرية الوطنية والقوانين المحلية.',
      'تحفظ قائمة بالأدوار السيبرانية الحساسة المحددة.',
      'يتحقق من الهوية قبل التعيين في الأدوار السيبرانية الحساسة.',
      'يتحقق من التاريخ الوظيفي قبل التعيين في الأدوار السيبرانية الحساسة.',
      'يتحقق من تعارض المصالح قبل التعيين في الأدوار السيبرانية الحساسة.',
      'نتائج التحري موثقة ومحفوظة.'
    ],
    evidence: [
      'Register of designated sensitive cyber roles',
      'Screening records held per role holder in line with HR policy',
      'Recruitment policy clause covering national prioritization',
      'Hiring file samples showing completed checks'
    ],
    evidenceAr: [
      'سجل الأدوار السيبرانية الحساسة المحددة',
      'سجلات التحري المحفوظة لكل شاغل دور وفق سياسة الموارد البشرية',
      'بند في سياسة التوظيف يغطي أولوية الكوادر الوطنية',
      'عينات من ملفات التعيين تبين استكمال عمليات التحري'
    ],
    cadence: 'per hire',
    effort: 'low',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['GV.RR-04', 'PR.AA-01'], cis: ['14.1'] }
  },
  {
    id: 'GOV-5',
    fn: 'GOV',
    title: 'Periodic Self-Assessment & Continuous Improvement',
    titleAr: 'التقييم الذاتي الدوري والتحسين المستمر',
    purpose: 'Provide a minimal mechanism to measure implementation of this baseline.',
    purposeAr: 'توفير آلية بسيطة لقياس مدى تطبيق هذه الضوابط.',
    purposeSource: 'annex',
    requirement:
      'At least once per year, complete a self-assessment against this baseline using an NCSC-issued or NCSC-approved checklist. Document the results, key gaps, actions, and target dates. Retain the record for at least three years and make it available to NCSC upon request. Use major incidents or audits to update priorities.',
        requirementAr:
      'تستكمل الجهة مرة واحدة سنويا على الأقل تقييما ذاتيا مقابل هذه الضوابط باستخدام قائمة تحقق صادرة عن المركز أو معتمدة منه، وتوثق النتائج والفجوات الرئيسية والإجراءات والتواريخ المستهدفة، ثم تحفظ السجل ثلاث سنوات على الأقل وتتيحه للمركز عند الطلب، وتستفيد من الحوادث الكبرى وعمليات التدقيق في تحديث الأولويات.',
checks: [
      'A self assessment against the baseline is completed at least once per year.',
      'The self assessment uses an NCSC issued or NCSC approved checklist.',
      'Results are documented.',
      'Key gaps are documented.',
      'Remediation actions are documented.',
      'Target dates are recorded against each action.',
      'Assessment records are retained for at least three years.',
      'Records can be produced for NCSC on request.',
      'Major incidents and audit findings feed back into assessment priorities.'
    ],
    checksAr: [
      'يستكمل تقييم ذاتي مقابل الضوابط مرة واحدة سنويا على الأقل.',
      'التقييم الذاتي يستخدم قائمة تحقق صادرة عن المركز أو معتمدة منه.',
      'النتائج موثقة.',
      'الفجوات الرئيسية موثقة.',
      'إجراءات المعالجة موثقة.',
      'تواريخ مستهدفة مسجلة لكل إجراء.',
      'سجلات التقييم محفوظة ثلاث سنوات على الأقل.',
      'السجلات يمكن تقديمها للمركز عند الطلب.',
      'الحوادث الكبرى وملاحظات التدقيق تغذي أولويات التقييم.'
    ],
    evidence: [
      'Completed self assessment for the current year',
      'Gap and action register with owners and target dates',
      'Retention proof covering the last three annual cycles',
      'Change log showing priorities updated after an incident or audit'
    ],
    evidenceAr: [
      'التقييم الذاتي المكتمل للسنة الحالية',
      'سجل الفجوات والإجراءات مع المسؤولين والتواريخ المستهدفة',
      'ما يثبت الحفظ لآخر ثلاث دورات سنوية',
      'سجل تغيير يبين تحديث الأولويات بعد حادث أو تدقيق'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['GV.OV-01', 'GV.OV-03', 'ID.IM-02'], cis: ['17.4'] }
  },
  {
    id: 'GOV-6',
    fn: 'GOV',
    title: 'Service Provider & Outsourcing Governance',
    titleAr: 'حوكمة مزودي الخدمة والإسناد الخارجي',
    purpose: 'Manage cybersecurity risk arising from external providers, including cloud.',
    purposeAr: 'إدارة مخاطر الأمن السيبراني الناشئة عن مزودي الخدمات الخارجيين ومنهم مزودو الخدمات السحابية.',
    purposeSource: 'annex',
    requirement:
      'Establish and maintain an inventory of service providers (including cloud/managed services), including classification and an entity contact for each provider; review at least annually or upon significant change.\n' +
      '• For service providers handling Sensitive data or supporting critical services, document the service scope and shared responsibilities for protecting the service and data.\n' +
      '• Ensure incident response contact information includes relevant service providers, and define incident reporting timeframes and mechanisms for provider-related incidents.\n' +
      '• For offboarding/termination, ensure required actions are performed to remove access and handle data appropriately, retaining evidence where applicable.',
        requirementAr:
      'تنشئ الجهة حصرا لمزودي الخدمة يشمل الخدمات السحابية والمدارة وتحفظه، ويتضمن تصنيفا وجهة اتصال داخل الجهة لكل مزود، ويراجع سنويا على الأقل أو عند أي تغيير جوهري.\n' +
      '• وبالنسبة لمزودي الخدمة الذين يتعاملون مع بيانات حساسة أو يدعمون خدمات حرجة، يوثق نطاق الخدمة والمسؤوليات المشتركة عن حماية الخدمة والبيانات.\n' +
      '• وتضمن الجهة أن تشمل بيانات الاتصال الخاصة بالاستجابة للحوادث مزودي الخدمة المعنيين، وأن تحدد مهل الإبلاغ عن الحوادث المتعلقة بالمزودين وآلياته.\n' +
      '• وعند إنهاء التعاقد، تتخذ الإجراءات اللازمة لإزالة الوصول والتعامل مع البيانات على النحو المناسب مع حفظ ما يثبت ذلك حيثما أمكن.',
checks: [
      'An inventory of service providers exists and covers cloud and managed services.',
      'Each provider record carries a classification.',
      'Each provider record names an entity contact.',
      'The inventory is reviewed at least annually or upon significant change.',
      'Service scope is documented for providers handling Sensitive data or critical services.',
      'Shared responsibilities for protecting the service and data are documented for those providers.',
      'Incident response contact information includes relevant service providers.',
      'Incident reporting timeframes are defined for provider related incidents.',
      'Incident reporting mechanisms are defined for provider related incidents.',
      'Offboarding actions remove provider access.',
      'Offboarding actions handle provider held data appropriately.',
      'Evidence of offboarding actions is retained.'
    ],
    checksAr: [
      'يوجد حصر لمزودي الخدمة يشمل الخدمات السحابية والمدارة.',
      'كل سجل مزود يحمل تصنيفا.',
      'كل سجل مزود يسمي جهة اتصال داخل الجهة.',
      'الحصر يراجع سنويا على الأقل أو عند أي تغيير جوهري.',
      'نطاق الخدمة موثق لمزودي البيانات الحساسة أو الخدمات الحرجة.',
      'المسؤوليات المشتركة عن حماية الخدمة والبيانات موثقة لهؤلاء المزودين.',
      'بيانات الاتصال للاستجابة للحوادث تشمل مزودي الخدمة المعنيين.',
      'مهل الإبلاغ عن الحوادث المتعلقة بالمزودين محددة.',
      'آليات الإبلاغ عن الحوادث المتعلقة بالمزودين محددة.',
      'إجراءات إنهاء التعاقد تزيل وصول المزود.',
      'إجراءات إنهاء التعاقد تعالج البيانات المحفوظة لدى المزود على النحو المناسب.',
      'ما يثبت تنفيذ إجراءات إنهاء التعاقد محفوظ.'
    ],
    evidence: [
      'Service provider register with classification, contact and review date',
      'Scope and shared responsibility documents for critical providers',
      'Incident contact list including provider escalation paths',
      'Completed offboarding checklists with access removal proof'
    ],
    evidenceAr: [
      'سجل مزودي الخدمة مع التصنيف وجهة الاتصال وتاريخ المراجعة',
      'وثائق النطاق والمسؤوليات المشتركة للمزودين الحرجين',
      'قائمة اتصال الحوادث شاملة مسارات التصعيد لدى المزودين',
      'قوائم تحقق إنهاء التعاقد مكتملة مع ما يثبت إزالة الوصول'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['GV.SC-04', 'GV.SC-07', 'GV.SC-10'], cis: ['15.1', '15.2', '15.4'] }
  }
];

