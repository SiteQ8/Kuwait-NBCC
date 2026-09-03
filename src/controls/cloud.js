/*
 * Appendix A of the Kuwait NBCC baseline: cloud security minimum controls.
 *
 * The appendix applies to every entity using public cloud services, whether
 * Software as a Service, Platform as a Service or Infrastructure as a Service.
 * Its two core principles are shared responsibility, under which the provider
 * secures the infrastructure while the entity secures its data and
 * configuration, and identity as the perimeter, under which who you are matters
 * more than where you are.
 *
 * The appendix draws a further distinction that shapes several of the controls
 * below. Customer Content means files, databases and application data, and it
 * carries the residency and processing rules of the National Data
 * Classification Framework. Operational Metadata means resource identifiers,
 * file names, IP addresses, billing logs and system status, and it may be
 * processed globally so the platform stays secure, reliable and correctly
 * billed.
 */

export const CLOUD = [
  {
    id: 'CLD-1',
    fn: 'CLD',
    title: 'Regulatory Authorization',
    titleAr: 'الترخيص التنظيمي',
    purpose: 'Confirm the provider may lawfully operate in Kuwait before it is engaged.',
    purposeAr: 'التحقق من أحقية المزود في العمل داخل الكويت قبل التعاقد معه.',
    purposeSource: 'editorial',
    requirement:
      'Entities MUST ensure the Cloud Service Provider (CSP) is authorized to operate in the State of Kuwait in accordance with regulations issued by the relevant national authorities',
        requirementAr:
      'يجب على الجهات التأكد من أن مزود الخدمة السحابية مرخص له بالعمل في دولة الكويت وفقا للوائح الصادرة عن الجهات الوطنية المختصة',
checks: [
      'Every cloud service provider in use is authorized to operate in the State of Kuwait.',
      'Authorization is verified against regulations issued by the relevant national authorities.',
      'Verification is recorded before the provider is engaged.'
    ],
    checksAr: [
      'كل مزود خدمة سحابية مستخدم مرخص له بالعمل في دولة الكويت.',
      'يتحقق من الترخيص مقابل اللوائح الصادرة عن الجهات الوطنية المختصة.',
      'يوثق التحقق قبل التعاقد مع المزود.'
    ],
    evidence: [
      'Copy of the provider authorization or licence',
      'Verification note in the procurement file',
      'Provider register entry linking to the authorization record'
    ],
    evidenceAr: [
      'نسخة من ترخيص المزود أو تصريحه',
      'مذكرة التحقق ضمن ملف المشتريات',
      'مدخل في سجل المزودين يربط بوثيقة الترخيص'
    ],
    cadence: 'per engagement',
    effort: 'low',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.SC-03', 'GV.OC-03'], cis: ['15.1'] }
  },
  {
    id: 'CLD-2',
    fn: 'CLD',
    title: 'Provider Due Diligence',
    titleAr: 'العناية الواجبة بمزود الخدمة',
    purpose: 'Evaluate the security posture of the provider before selection.',
    purposeAr: 'تقييم الوضع الأمني للمزود قبل اختياره.',
    purposeSource: 'editorial',
    requirement:
      'Prior to selection, Entities MUST evaluate the CSP\u2019s security posture. This requirement is satisfied by reviewing the CSP\u2019s valid, independent international security certifications (e.g., ISO 27001, SOC 2 Type II, CSA STAR Level 2).',
        requirementAr:
      'يجب على الجهات قبل الاختيار تقييم الوضع الأمني لمزود الخدمة السحابية، ويستوفى هذا المتطلب بمراجعة الشهادات الأمنية الدولية المستقلة السارية لدى المزود مثل الأيزو 27001 وSOC 2 Type II وCSA STAR المستوى الثاني.',
checks: [
      'The security posture of the provider is evaluated before selection.',
      'The evaluation reviews valid independent international security certifications.',
      'Certification validity dates are checked and recorded.'
    ],
    checksAr: [
      'يقيم الوضع الأمني للمزود قبل اختياره.',
      'يراجع التقييم الشهادات الأمنية الدولية المستقلة السارية.',
      'تواريخ سريان الشهادات تفحص وتوثق.'
    ],
    evidence: [
      'Certification copies such as ISO 27001, SOC 2 Type II or CSA STAR Level 2',
      'Due diligence assessment record with reviewer and date',
      'Diary entry for the next certification expiry'
    ],
    evidenceAr: [
      'نسخ الشهادات مثل الأيزو 27001 أو SOC 2 Type II أو CSA STAR المستوى الثاني',
      'محضر تقييم العناية الواجبة مع اسم المراجع والتاريخ',
      'قيد في التقويم بموعد انتهاء الشهادة التالي'
    ],
    cadence: 'per engagement',
    effort: 'low',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.SC-06', 'GV.SC-07'], cis: ['15.3', '15.5'] }
  },
  {
    id: 'CLD-3',
    fn: 'CLD',
    title: 'Right to Audit (Third-Party Assurance)',
    titleAr: 'حق التدقيق (تأكيدات الأطراف الخارجية)',
    purpose: 'Preserve assurance over a shared environment without physical inspection.',
    purposeAr: 'الحصول على تأكيد بشأن البيئة المشتركة دون الحاجة إلى زيارة ميدانية.',
    purposeSource: 'editorial',
    requirement:
      'Contracts MUST include a "Right to Audit." To protect the security of multi-tenant environments, this right is exercised by the Entity reviewing the CSP\u2019s independent Third-Party Audit Reports (e.g., SOC 2, C5) rather than conducting physical data center visits.',
        requirementAr:
      'يجب أن تتضمن العقود حق التدقيق، وحماية لأمن البيئات متعددة المستأجرين يمارس هذا الحق بمراجعة الجهة لتقارير التدقيق المستقلة الصادرة عن طرف ثالث لدى المزود مثل SOC 2 وC5 بدلا من إجراء زيارات مادية لمراكز البيانات.',
checks: [
      'Every cloud contract includes a right to audit clause.',
      'The right is exercised by reviewing independent third party audit reports.',
      'Reports are obtained and reviewed rather than physical data center visits being sought.'
    ],
    checksAr: [
      'يتضمن كل عقد سحابي بندا بحق التدقيق.',
      'يمارس الحق عبر مراجعة تقارير تدقيق مستقلة من طرف ثالث.',
      'تطلب التقارير وتراجع بدلا من السعي لزيارة مراكز البيانات ماديا.'
    ],
    evidence: [
      'Contract clause reference for each cloud agreement',
      'Latest third party audit report on file such as SOC 2 or C5',
      'Review note recording exceptions and their treatment'
    ],
    evidenceAr: [
      'مرجع البند التعاقدي لكل اتفاقية سحابية',
      'أحدث تقرير تدقيق من طرف ثالث محفوظ مثل SOC 2 أو C5',
      'مذكرة مراجعة تسجل الملاحظات وكيفية معالجتها'
    ],
    cadence: 'annual',
    effort: 'low',
    phase: 2,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.SC-05', 'GV.SC-07'], cis: ['15.5'] }
  },
  {
    id: 'CLD-4',
    fn: 'CLD',
    title: 'Incident Notification Clause',
    titleAr: 'شرط الإخطار بالحوادث',
    purpose: 'Guarantee the entity learns of provider side incidents in time to act.',
    purposeAr: 'ضمان علم الجهة بحوادث المزود في وقت يسمح لها بالتصرف.',
    purposeSource: 'editorial',
    requirement:
      'Contracts MUST include a commitment from the CSP to notify the Entity of a confirmed data incident without undue delay to allow for accurate investigation and reporting.',
        requirementAr:
      'يجب أن تتضمن العقود التزاما من مزود الخدمة السحابية بإخطار الجهة بأي حادث مؤكد يمس البيانات دون تأخير غير مبرر بما يتيح التحقيق والإبلاغ على نحو دقيق.',
checks: [
      'Every cloud contract commits the provider to notify the entity of a confirmed data incident.',
      'The commitment requires notification without undue delay.',
      'The notification path feeds the entity incident process under RS-1.'
    ],
    checksAr: [
      'يلزم كل عقد سحابي المزود بإخطار الجهة عند تأكد وقوع حادث يمس البيانات.',
      'يشترط الالتزام الإخطار دون تأخير غير مبرر.',
      'مسار الإخطار يغذي آلية الحوادث لدى الجهة وفق الضابط RS-1.'
    ],
    evidence: [
      'Contract clause reference for each cloud agreement',
      'Provider notification contact recorded in the incident contact list',
      'Any notification received and its handling record'
    ],
    evidenceAr: [
      'مرجع البند التعاقدي لكل اتفاقية سحابية',
      'جهة اتصال الإخطار لدى المزود مدرجة في قائمة اتصال الحوادث',
      'أي إخطار ورد ومحضر التعامل معه'
    ],
    cadence: 'per engagement',
    effort: 'low',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.SC-08', 'RS.CO-02'], cis: ['15.6', '17.2'] }
  },
  {
    id: 'CLD-5',
    fn: 'CLD',
    title: 'Data Ownership & Exit',
    titleAr: 'ملكية البيانات وإنهاء الخدمة',
    purpose: 'Keep ownership with the entity and keep exit technically possible.',
    purposeAr: 'إبقاء ملكية البيانات لدى الجهة وإبقاء إنهاء الخدمة ممكنا من الناحية التقنية.',
    purposeSource: 'editorial',
    requirement:
      'The contract MUST explicitly state that the Entity retains exclusive ownership of their data. The CSP MUST provide tools or standard APIs to allow the Entity to retrieve their data upon contract termination.',
        requirementAr:
      'يجب أن ينص العقد صراحة على احتفاظ الجهة بالملكية الحصرية لبياناتها، ويجب على مزود الخدمة السحابية توفير أدوات أو واجهات برمجية قياسية تمكن الجهة من استرجاع بياناتها عند إنهاء العقد.',
checks: [
      'The contract explicitly states that the entity retains exclusive ownership of its data.',
      'The provider offers tools or standard APIs for data retrieval on termination.',
      'The retrieval route is identified and understood before it is needed.'
    ],
    checksAr: [
      'ينص العقد صراحة على احتفاظ الجهة بالملكية الحصرية لبياناتها.',
      'يوفر المزود أدوات أو واجهات برمجية قياسية لاسترجاع البيانات عند الإنهاء.',
      'مسار الاسترجاع محدد ومفهوم قبل الحاجة إليه.'
    ],
    evidence: [
      'Ownership clause reference for each cloud agreement',
      'Documented export path or API for the data held',
      'Exit plan note in the provider register'
    ],
    evidenceAr: [
      'مرجع بند الملكية لكل اتفاقية سحابية',
      'مسار تصدير موثق أو واجهة برمجية للبيانات المحفوظة',
      'مذكرة خطة الخروج ضمن سجل المزودين'
    ],
    cadence: 'per engagement',
    effort: 'low',
    phase: 2,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.SC-10', 'ID.AM-08'], cis: ['15.7'] }
  },
  {
    id: 'CLD-6',
    fn: 'CLD',
    title: 'Service Level Agreements (SLAs)',
    titleAr: 'اتفاقيات مستوى الخدمة (SLA)',
    purpose: 'Fix availability expectations and the remedy for missing them.',
    purposeAr: 'تثبيت التوقعات بشأن الإتاحة وتحديد التعويض عند الإخلال بها.',
    purposeSource: 'editorial',
    requirement:
      'Contracts MUST define Service Level Agreements (SLAs) for availability. The agreement SHOULD include financial remedies (service credits) for failure to meet these standards.',
        requirementAr:
      'يجب أن تحدد العقود اتفاقيات مستوى الخدمة الخاصة بالإتاحة، وينبغي أن تتضمن الاتفاقية تعويضات مالية في صورة أرصدة خدمة عند الإخفاق في بلوغ هذه المستويات.',
checks: [
      'Every cloud contract defines a service level agreement for availability.',
      'The agreement includes financial remedies such as service credits.',
      'Achieved availability is compared against the agreed level.'
    ],
    checksAr: [
      'يحدد كل عقد سحابي اتفاقية مستوى خدمة للإتاحة.',
      'تتضمن الاتفاقية تعويضات مالية مثل أرصدة الخدمة.',
      'تقارن الإتاحة المتحققة بالمستوى المتفق عليه.'
    ],
    evidence: [
      'SLA schedule for each cloud agreement',
      'Service credit terms',
      'Availability reports for the reporting period'
    ],
    evidenceAr: [
      'جدول اتفاقية مستوى الخدمة لكل اتفاقية سحابية',
      'شروط أرصدة الخدمة',
      'تقارير الإتاحة عن فترة التقرير'
    ],
    cadence: 'annual',
    effort: 'low',
    phase: 3,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.SC-05', 'ID.AM-08'], cis: ['15.4'] }
  },
  {
    id: 'CLD-7',
    fn: 'CLD',
    title: 'Shared Responsibility Matrix',
    titleAr: 'مصفوفة المسؤولية المشتركة',
    purpose: 'Remove ambiguity about which party secures which layer.',
    purposeAr: 'إزالة الغموض بشأن الطرف المسؤول عن تأمين كل طبقة.',
    purposeSource: 'editorial',
    requirement:
      'Entities MUST document the cloud service model (IaaS, PaaS, or SaaS) and the resulting division of security responsibilities. The Entity retains accountability for Data Classification, Identity & Access Management (IAM), and Resource Configuration, regardless of the model.',
        requirementAr:
      'يجب على الجهات توثيق نموذج الخدمة السحابية سواء كان بنية تحتية كخدمة أو منصة كخدمة أو برمجية كخدمة، وتوثيق ما يترتب عليه من توزيع للمسؤوليات الأمنية، وتظل الجهة مسؤولة عن تصنيف البيانات وإدارة الهوية والوصول وتهيئة الموارد أيا كان النموذج.',
checks: [
      'The cloud service model is documented for each service as IaaS, PaaS or SaaS.',
      'The resulting division of security responsibilities is documented.',
      'The entity accepts accountability for data classification regardless of model.',
      'The entity accepts accountability for identity and access management regardless of model.',
      'The entity accepts accountability for resource configuration regardless of model.'
    ],
    checksAr: [
      'نموذج الخدمة السحابية موثق لكل خدمة بوصفه بنية تحتية أو منصة أو برمجية كخدمة.',
      'توزيع المسؤوليات الأمنية المترتب على ذلك موثق.',
      'تقر الجهة بمسؤوليتها عن تصنيف البيانات أيا كان النموذج.',
      'تقر الجهة بمسؤوليتها عن إدارة الهوية والوصول أيا كان النموذج.',
      'تقر الجهة بمسؤوليتها عن تهيئة الموارد أيا كان النموذج.'
    ],
    evidence: [
      'Shared responsibility matrix per cloud service',
      'Service model field populated in the provider register',
      'Owner named for classification, IAM and configuration in each environment'
    ],
    evidenceAr: [
      'مصفوفة المسؤولية المشتركة لكل خدمة سحابية',
      'حقل نموذج الخدمة مستوفى في سجل المزودين',
      'تسمية مالك للتصنيف وإدارة الهوية والتهيئة في كل بيئة'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.SC-04', 'GV.RR-02'], cis: ['15.2'] }
  },
  {
    id: 'CLD-8',
    fn: 'CLD',
    title: 'Cloud Asset Inventory',
    titleAr: 'حصر الأصول السحابية',
    purpose: 'Keep a live view of cloud resources and what they hold.',
    purposeAr: 'الاحتفاظ برؤية آنية للموارد السحابية ولما تحتويه.',
    purposeSource: 'editorial',
    requirement:
      'Maintain a real-time inventory of cloud resources. Use programmatic resource tagging to identify the Data Classification (Public, Restricted, Sensitive) and Business Owner of each resource.',
        requirementAr:
      'تحفظ الجهة حصرا آنيا لموارد السحابة، وتستخدم الوسم البرمجي للموارد لتحديد تصنيف البيانات لكل مورد بوصفه عاما أو مقيدا أو حساسا وتحديد مالكه من جهة الأعمال.',
checks: [
      'A real time inventory of cloud resources is maintained.',
      'Programmatic resource tagging is in use.',
      'Tags identify the data classification of each resource as Public, Restricted or Sensitive.',
      'Tags identify the business owner of each resource.'
    ],
    checksAr: [
      'يحفظ حصر آني لموارد السحابة.',
      'الوسم البرمجي للموارد مستخدم.',
      'تبين الوسوم تصنيف بيانات كل مورد بوصفه عاما أو مقيدا أو حساسا.',
      'تبين الوسوم مالك المورد من جهة الأعمال.'
    ],
    evidence: [
      'Inventory export from the cloud provider or a cloud posture tool',
      'Tagging standard document',
      'Report of untagged or non compliant resources and their remediation'
    ],
    evidenceAr: [
      'تصدير الحصر من مزود السحابة أو من أداة لمتابعة الوضع السحابي',
      'وثيقة معيار الوسم',
      'تقرير الموارد غير الموسومة أو غير الممتثلة وما اتخذ لمعالجتها'
    ],
    cadence: 'continuous',
    effort: 'medium',
    phase: 2,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['ID.AM-01', 'ID.AM-07'], cis: ['1.1', '3.1'] }
  },
  {
    id: 'CLD-9',
    fn: 'CLD',
    title: 'MFA for Cloud Consoles',
    titleAr: 'المصادقة متعددة العوامل للوحات التحكم السحابية',
    purpose: 'Protect the highest value credentials in the environment.',
    purposeAr: 'حماية أثمن بيانات الاعتماد في البيئة.',
    purposeSource: 'editorial',
    requirement:
      'Multi-Factor Authentication (MFA) MUST be enforced for all users with administrative access to the Cloud Management Console and root accounts.',
        requirementAr:
      'يجب فرض المصادقة متعددة العوامل على جميع المستخدمين ذوي الوصول الإداري إلى لوحة الإدارة السحابية وعلى الحسابات الجذرية.',
checks: [
      'MFA is enforced for every user with administrative access to the cloud management console.',
      'MFA is enforced on root accounts.',
      'Enforcement is technical rather than advisory.'
    ],
    checksAr: [
      'المصادقة متعددة العوامل مفروضة على كل مستخدم له وصول إداري إلى لوحة الإدارة السحابية.',
      'المصادقة متعددة العوامل مفروضة على الحسابات الجذرية.',
      'الفرض تقني لا توجيهي.'
    ],
    evidence: [
      'MFA enforcement policy from the cloud identity provider',
      'Report listing every console administrator and MFA status',
      'Root account protection evidence including any break glass procedure'
    ],
    evidenceAr: [
      'سياسة فرض المصادقة متعددة العوامل من مزود الهوية السحابي',
      'تقرير يعدد كل مدير للوحة الإدارة وحالة المصادقة متعددة العوامل لديه',
      'ما يثبت حماية الحساب الجذري بما في ذلك أي إجراء للوصول الطارئ'
    ],
    cadence: 'continuous',
    effort: 'low',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['PR.AA-03', 'PR.AA-05'], cis: ['6.5', '5.4'] }
  },
  {
    id: 'CLD-10',
    fn: 'CLD',
    title: 'Service Account Hygiene',
    titleAr: 'سلامة حسابات الخدمة',
    purpose: 'Prevent credential theft through long lived non human identities.',
    purposeAr: 'منع سرقة بيانات الاعتماد عبر الهويات غير البشرية طويلة الأمد.',
    purposeSource: 'editorial',
    requirement:
      'Service Accounts (non-human identities) MUST NOT be used for interactive human login. Keys for service accounts SHOULD be rotated periodically based on risk, or managed via automated identity federation (e.g., OIDC) to prevent credential theft.',
        requirementAr:
      'لا يجوز استخدام حسابات الخدمة، أي الهويات غير البشرية، في الدخول التفاعلي البشري، وينبغي تدوير مفاتيح حسابات الخدمة دوريا بناء على المخاطر أو إدارتها عبر اتحاد هوية آلي مثل OIDC منعا لسرقة بيانات الاعتماد.',
checks: [
      'Service accounts are not used for interactive human login.',
      'Service account keys are rotated periodically based on risk, or federation removes the need for static keys.',
      'Automated identity federation such as OIDC is used where available.'
    ],
    checksAr: [
      'لا تستخدم حسابات الخدمة للدخول التفاعلي البشري.',
      'تجدد مفاتيح حسابات الخدمة دوريا بحسب المخاطر أو يستعاض عنها باتحاد الهوية بدل المفاتيح الثابتة.',
      'يستخدم اتحاد الهوية الآلي مثل OIDC حيثما توفر.'
    ],
    evidence: [
      'Service account register with key age or federation status',
      'Policy statement prohibiting interactive use of service accounts',
      'Key rotation records or federation configuration'
    ],
    evidenceAr: [
      'سجل حسابات الخدمة مع عمر المفاتيح أو حالة اتحاد الهوية',
      'نص السياسة الذي يحظر الاستخدام التفاعلي لحسابات الخدمة',
      'سجلات تجديد المفاتيح أو إعداد اتحاد الهوية'
    ],
    cadence: 'quarterly',
    effort: 'medium',
    phase: 2,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['PR.AA-01', 'PR.AA-05'], cis: ['5.2', '5.4', '5.6'] }
  },
  {
    id: 'CLD-11',
    fn: 'CLD',
    title: 'Encryption by Default',
    titleAr: 'التشفير الافتراضي',
    purpose: 'Ensure stored data is unreadable without the key.',
    purposeAr: 'ضمان عدم إمكانية قراءة البيانات المخزنة دون المفتاح.',
    purposeSource: 'editorial',
    requirement:
      'All data at rest in the cloud MUST be encrypted. Entities SHOULD utilize the CSP\u2019s default encryption (platform-managed keys) as a minimum standard. For Sensitive data, Entities MAY opt for Customer-Managed Encryption Keys (CMEK) on cloud, based on a risk assessment. In accordance with Decision (1) of 2025.',
        requirementAr:
      'يجب تشفير جميع البيانات المحفوظة في السحابة، وينبغي أن تستخدم الجهات التشفير الافتراضي لدى مزود الخدمة السحابية أي المفاتيح المدارة من المنصة بوصفه حدا أدنى، أما البيانات الحساسة فيجوز أن تختار الجهات لها مفاتيح تشفير يديرها العميل في السحابة بناء على تقييم للمخاطر، وذلك وفقا للقرار رقم 1 لسنة 2025.',
checks: [
      'All data at rest in the cloud is encrypted.',
      'Platform managed keys are used at minimum.',
      'Use of customer managed encryption keys for Sensitive data is decided on a risk assessment.',
      'The approach aligns with Decision No. 1 of 2025.'
    ],
    checksAr: [
      'كل البيانات المحفوظة في السحابة مشفرة.',
      'المفاتيح المدارة من المنصة مستخدمة كحد أدنى.',
      'استخدام مفاتيح تشفير يديرها العميل للبيانات الحساسة يقرر بناء على تقييم للمخاطر.',
      'النهج متوائم مع القرار رقم 1 لسنة 2025.'
    ],
    evidence: [
      'Encryption status report across storage, database and backup services',
      'Key management approach note per environment',
      'Risk assessment supporting the CMEK decision for Sensitive data'
    ],
    evidenceAr: [
      'تقرير حالة التشفير عبر خدمات التخزين وقواعد البيانات والنسخ الاحتياطي',
      'مذكرة نهج إدارة المفاتيح لكل بيئة',
      'تقييم المخاطر الداعم لقرار المفاتيح المدارة من العميل للبيانات الحساسة'
    ],
    cadence: 'continuous',
    effort: 'low',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['PR.DS-01', 'PR.DS-02'], cis: ['3.11', '3.6'] }
  },
  {
    id: 'CLD-12',
    fn: 'CLD',
    title: 'Data Residency (Customer Content)',
    titleAr: 'توطين البيانات (محتوى العميل)',
    purpose: 'Keep Customer Content where the national framework requires it.',
    purposeAr: 'إبقاء محتوى العميل داخل النطاق الجغرافي الذي يفرضه الإطار الوطني.',
    purposeSource: 'editorial',
    requirement:
      'The Entity MUST configure cloud services and related contracts to store and process Customer Content (files, databases, application data) according to the National Data Classification Framework (Decision No. 1 of 2025).',
        requirementAr:
      'يجب على الجهة تهيئة الخدمات السحابية والعقود المرتبطة بها لحفظ محتوى العميل، أي الملفات وقواعد البيانات وبيانات التطبيقات، ومعالجته وفقا للإطار الوطني لتصنيف البيانات الصادر بالقرار رقم 1 لسنة 2025.',
checks: [
      'Cloud services are configured to store Customer Content in line with the National Data Classification Framework.',
      'Cloud services are configured to process Customer Content in line with that framework.',
      'Related contracts carry the same residency commitment.',
      'Customer Content is understood to mean files, databases and application data.'
    ],
    checksAr: [
      'الخدمات السحابية مهيأة لحفظ محتوى العميل بما يتفق مع الإطار الوطني لتصنيف البيانات.',
      'الخدمات السحابية مهيأة لمعالجة محتوى العميل بما يتفق مع ذلك الإطار.',
      'تحمل العقود ذات الصلة الالتزام نفسه بتوطين البيانات.',
      'محتوى العميل مفهوم بأنه الملفات وقواعد البيانات وبيانات التطبيقات.'
    ],
    evidence: [
      'Region configuration per service holding Customer Content',
      'Contract clause on data location',
      'Mapping of data sets to regions with their classification'
    ],
    evidenceAr: [
      'إعداد المنطقة الجغرافية لكل خدمة تحتفظ بمحتوى العميل',
      'البند التعاقدي الخاص بموقع البيانات',
      'مواءمة بين مجموعات البيانات والمناطق مع تصنيف كل منها'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['GV.OC-03', 'PR.DS-01'], cis: ['3.1', '3.12'] }
  },
  {
    id: 'CLD-13',
    fn: 'CLD',
    title: 'Operational Metadata Exemption',
    titleAr: 'استثناء البيانات الوصفية التشغيلية',
    purpose: 'Keep the residency rule workable by keeping metadata non sensitive.',
    purposeAr: 'إبقاء قاعدة التوطين قابلة للتطبيق بجعل البيانات الوصفية غير حساسة.',
    purposeSource: 'editorial',
    requirement:
      'Residency requirements apply to Customer Content. Operational Metadata (e.g., project IDs, billing logs, system status, and IP addresses) can be processed globally to ensure platform security, reliability, and accurate billing. Entities must ensure that metadata identifiers (such as Project IDs, folder names and labels) remain non-sensitive.',
        requirementAr:
      'تسري متطلبات توطين البيانات على محتوى العميل، أما البيانات الوصفية التشغيلية مثل معرفات المشاريع وسجلات الفوترة وحالة الأنظمة وعناوين بروتوكول الإنترنت فيمكن معالجتها عالميا ضمانا لأمن المنصة وموثوقيتها ودقة الفوترة، وعلى الجهات التأكد من بقاء معرفات البيانات الوصفية مثل معرفات المشاريع وأسماء المجلدات والوسوم غير حساسة.',
checks: [
      'The entity distinguishes Customer Content from Operational Metadata in its records.',
      'Project identifiers remain non sensitive.',
      'Folder names remain non sensitive.',
      'Labels remain non sensitive.',
      'Naming guidance is issued so metadata does not leak sensitive information.'
    ],
    checksAr: [
      'تميز الجهة محتوى العميل عن البيانات الوصفية التشغيلية في سجلاتها.',
      'معرفات المشاريع تبقى غير حساسة.',
      'أسماء المجلدات تبقى غير حساسة.',
      'تبقى الوسوم غير حساسة.',
      'تصدر إرشادات للتسمية حتى لا تسرب البيانات الوصفية معلومات حساسة.'
    ],
    evidence: [
      'Naming and tagging convention prohibiting sensitive strings',
      'Review of existing project names, folders and labels',
      'Remediation record for identifiers that had to be renamed'
    ],
    evidenceAr: [
      'عرف التسمية والوسم الذي يحظر النصوص الحساسة',
      'مراجعة لأسماء المشاريع والمجلدات والوسوم القائمة',
      'محضر معالجة المعرفات التي لزم تغيير أسمائها'
    ],
    cadence: 'annual',
    effort: 'low',
    phase: 2,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['PR.DS-01', 'ID.AM-07'], cis: ['3.1'] }
  },
  {
    id: 'CLD-14',
    fn: 'CLD',
    title: 'Public Access Prevention',
    titleAr: 'منع الوصول العام',
    purpose: 'Close the single most common cause of cloud data exposure.',
    purposeAr: 'سد أكثر أسباب انكشاف البيانات السحابية شيوعا.',
    purposeSource: 'editorial',
    requirement:
      'Cloud storage resources (e.g., object storage buckets) MUST be configured to block public access by default. Public exposure MUST be an explicit, documented exception approved by the data owner.',
        requirementAr:
      'يجب تهيئة موارد التخزين السحابي مثل حاويات تخزين الكائنات لحجب الوصول العام افتراضيا، ويجب أن يكون أي كشف للعموم استثناء صريحا وموثقا ومعتمدا من مالك البيانات.',
checks: [
      'Cloud storage resources block public access by default.',
      'The default applies at the organization or account level, not only per resource.',
      'Any public exposure exists as an explicit documented exception.',
      'Each exception is approved by the data owner.'
    ],
    checksAr: [
      'تحجب موارد التخزين السحابي الوصول العام افتراضيا.',
      'الإعداد الافتراضي مطبق على مستوى المؤسسة أو الحساب لا على مستوى المورد وحده.',
      'أي كشف للعموم قائم بوصفه استثناء صريحا وموثقا.',
      'كل استثناء معتمد من مالك البيانات.'
    ],
    evidence: [
      'Organization policy or account setting enforcing public access block',
      'Scan report listing any publicly reachable storage',
      'Approved exception records naming the data owner'
    ],
    evidenceAr: [
      'سياسة المؤسسة أو إعداد الحساب الذي يفرض حجب الوصول العام',
      'تقرير فحص يعدد أي تخزين يمكن بلوغه من العموم',
      'سجلات الاستثناءات المعتمدة مع تسمية مالك البيانات'
    ],
    cadence: 'continuous',
    effort: 'low',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['PR.AA-05', 'PR.DS-01'], cis: ['3.3', '4.1'] }
  },
  {
    id: 'CLD-15',
    fn: 'CLD',
    title: 'Cloud Audit Logging',
    titleAr: 'تسجيل الأحداث السحابية',
    purpose: 'Record who changed the environment and who reached the data.',
    purposeAr: 'تسجيل من أجرى تغييرا على البيئة ومن اطلع على البيانات.',
    purposeSource: 'editorial',
    requirement:
      'Enable audit logging for cloud projects. Logs MUST capture "Admin Activity" (configuration changes) and "Data Access" (who accessed data) for sensitive workloads. Retain logs for a minimum of 12 months.',
        requirementAr:
      'تفعل الجهة تسجيل التدقيق لمشاريع السحابة، ويجب أن تلتقط السجلات النشاط الإداري أي تغييرات التهيئة والوصول إلى البيانات أي من اطلع عليها بالنسبة لأحمال العمل الحساسة، وتحفظ السجلات اثني عشر شهرا كحد أدنى.',
checks: [
      'Audit logging is enabled for cloud projects.',
      'Logs capture admin activity covering configuration changes.',
      'Logs capture data access for sensitive workloads.',
      'Cloud logs are retained for a minimum of 12 months.'
    ],
    checksAr: [
      'تسجيل التدقيق مفعل لمشاريع السحابة.',
      'تلتقط السجلات النشاط الإداري شاملا تغييرات التهيئة.',
      'تلتقط السجلات الوصول إلى البيانات في أحمال العمل الحساسة.',
      'تحفظ سجلات السحابة اثني عشر شهرا كحد أدنى.'
    ],
    evidence: [
      'Audit log configuration per project or subscription',
      'Retention setting proof showing at least 12 months',
      'Sample query demonstrating admin activity and data access capture'
    ],
    evidenceAr: [
      'إعداد سجل التدقيق لكل مشروع أو اشتراك',
      'ما يثبت إعداد الحفظ لاثني عشر شهرا على الأقل',
      'استعلام نموذجي يبين التقاط النشاط الإداري والوصول إلى البيانات'
    ],
    cadence: 'continuous',
    effort: 'medium',
    phase: 2,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['DE.CM-01', 'DE.CM-03'], cis: ['8.2', '8.5', '8.10'] }
  },
  {
    id: 'CLD-16',
    fn: 'CLD',
    title: 'Secure Connectivity',
    titleAr: 'الاتصال الآمن',
    purpose: 'Protect traffic in transit and keep management planes off the open internet.',
    purposeAr: 'حماية البيانات أثناء نقلها وإبعاد واجهات الإدارة عن الإنترنت المفتوح.',
    purposeSource: 'editorial',
    requirement:
      'All traffic between the entity and the cloud provider MUST be encrypted in transit using industry-standard protocols (e.g., TLS 1.2 or higher). Management interfaces MUST NOT be exposed directly to the public internet; use secure bastions, VPNs, or Identity-Aware Proxies.',
        requirementAr:
      'يجب تشفير كل حركة البيانات بين الجهة ومزود الخدمة السحابية أثناء النقل باستخدام بروتوكولات قياسية في الصناعة مثل TLS 1.2 فأعلى، ولا يجوز كشف واجهات الإدارة مباشرة على الإنترنت العام، بل تستخدم مضيفات وسيطة آمنة أو شبكات خاصة افتراضية أو وكلاء واعين بالهوية.',
checks: [
      'All traffic between the entity and the cloud provider is encrypted in transit.',
      'Encryption uses industry standard protocols such as TLS 1.2 or higher.',
      'Management interfaces are not exposed directly to the public internet.',
      'Access to management interfaces runs through a bastion, VPN or identity aware proxy.'
    ],
    checksAr: [
      'كل حركة البيانات بين الجهة ومزود السحابة مشفرة أثناء النقل.',
      'يستخدم التشفير بروتوكولات قياسية في الصناعة مثل TLS 1.2 فأعلى.',
      'واجهات الإدارة غير مكشوفة مباشرة على الإنترنت العام.',
      'يمر الوصول إلى واجهات الإدارة عبر مضيف وسيط أو شبكة خاصة افتراضية أو وكيل واع بالهوية.'
    ],
    evidence: [
      'TLS configuration and version report for entity to cloud paths',
      'Network policy showing management interfaces restricted',
      'Bastion, VPN or identity aware proxy configuration',
      'External scan confirming no exposed management endpoints'
    ],
    evidenceAr: [
      'تقرير إعداد وإصدار TLS لمسارات الاتصال بين الجهة والسحابة',
      'سياسة الشبكة التي تبين تقييد واجهات الإدارة',
      'إعداد المضيف الوسيط أو الشبكة الخاصة الافتراضية أو الوكيل الواعي بالهوية',
      'فحص خارجي يؤكد عدم وجود نقاط إدارة مكشوفة'
    ],
    cadence: 'continuous',
    effort: 'medium',
    phase: 1,
    appliesWhen: ['usesCloud'],
    crosswalk: { csf: ['PR.DS-02', 'PR.AA-05', 'PR.IR-01'], cis: ['3.10', '12.6', '12.7'] }
  }
];
