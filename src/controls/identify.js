// IDENTIFY (ID) controls of the Kuwait NBCC baseline.

export const IDENTIFY = [
  {
    id: 'ID-1',
    fn: 'ID',
    title: 'Asset & Service Inventory',
    titleAr: 'حصر الأصول والخدمات',
    purpose: 'Maintain an up-to-date view of hardware and key services.',
    purposeAr: 'الاحتفاظ بصورة محدثة عن الأجهزة والخدمات الرئيسية.',
    purposeSource: 'annex',
    requirement:
      'Maintain a central electronic inventory of hardware assets (servers, workstations, laptops, network equipment, IoT/OT devices, etc.) and key on-premises services. Record at least: owner, location, purpose, criticality, and lifecycle state (in use, spare, retired). For physical assets, use unique, machine-readable labels (e.g., barcode/QR-style) to support scanning and tracking. At least weekly, review network discovery or similar tools to identify unauthorized devices and either remove, block, or formally approve them.',
        requirementAr:
      'تحفظ الجهة حصرا إلكترونيا مركزيا لأصول العتاد، ومنها الخوادم ومحطات العمل والحواسيب المحمولة ومعدات الشبكة وأجهزة إنترنت الأشياء والتقنيات التشغيلية وغيرها، وكذلك الخدمات الرئيسية داخل المقر، ويسجل فيه كحد أدنى المالك والموقع والغرض ودرجة الحرجية وحالة دورة الحياة من حيث كونه قيد الاستخدام أو احتياطيا أو مسحوبا، أما الأصول المادية فتوسم بملصقات فريدة قابلة للقراءة آليا مثل الباركود أو رمز الاستجابة السريعة بما يدعم المسح والتتبع، وتراجع الجهة أسبوعيا على الأقل مخرجات أدوات اكتشاف الشبكة أو ما شابهها لتحديد الأجهزة غير المصرح بها ثم تزيلها أو تحجبها أو تعتمدها رسميا.',
checks: [
      'A central electronic inventory of hardware assets is maintained.',
      'The inventory covers servers, workstations, laptops, network equipment and IoT or OT devices.',
      'Key on premises services are recorded in the inventory.',
      'Each asset record captures an owner.',
      'Each asset record captures a location.',
      'Each asset record captures a purpose.',
      'Each asset record captures a criticality rating.',
      'Each asset record captures a lifecycle state of in use, spare or retired.',
      'Physical assets carry unique machine readable labels.',
      'Network discovery output is reviewed at least weekly.',
      'Unauthorized devices found are removed, blocked or formally approved.'
    ],
    checksAr: [
      'يحفظ حصر إلكتروني مركزي لأصول العتاد.',
      'يشمل الحصر الخوادم ومحطات العمل والحواسيب المحمولة ومعدات الشبكة وأجهزة إنترنت الأشياء أو التقنيات التشغيلية.',
      'الخدمات الرئيسية داخل المقر مسجلة في الحصر.',
      'يحمل كل سجل أصل مالكا.',
      'يحمل كل سجل أصل موقعا.',
      'يحمل كل سجل أصل غرضا.',
      'يحمل كل سجل أصل درجة حرجية.',
      'يحمل كل سجل أصل حالة دورة حياة قيد الاستخدام أو احتياطي أو مسحوب.',
      'تحمل الأصول المادية ملصقات فريدة قابلة للقراءة آليا.',
      'تراجع مخرجات اكتشاف الشبكة أسبوعيا على الأقل.',
      'تزال الأجهزة غير المصرح بها المكتشفة أو تحجب أو تعتمد رسميا.'
    ],
    evidence: [
      'Export of the asset inventory showing all mandatory fields',
      'Photographs or samples of asset labels',
      'Weekly discovery review log with disposition per finding',
      'Approval records for devices retained by exception'
    ],
    evidenceAr: [
      'تصدير لحصر الأصول يبين جميع الحقول الإلزامية',
      'صور أو عينات من ملصقات الأصول',
      'سجل المراجعة الأسبوعية للاكتشاف مع الإجراء المتخذ لكل نتيجة',
      'سجلات اعتماد الأجهزة المبقاة على سبيل الاستثناء'
    ],
    cadence: 'weekly',
    effort: 'high',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['ID.AM-01', 'ID.AM-02'], cis: ['1.1', '1.2'] }
  },
  {
    id: 'ID-2',
    fn: 'ID',
    title: 'Software & Provider Inventory',
    titleAr: 'حصر البرمجيات ومزودي الخدمة',
    purpose: 'Maintain visibility of software in use and service providers.',
    purposeAr: 'الحفاظ على وضوح الرؤية بشأن البرمجيات المستخدمة ومزودي الخدمات.',
    purposeSource: 'annex',
    requirement:
      'Maintain a list of authorized software (including version families) and service providers (including cloud and SaaS). At least monthly, review systems for unauthorized software and either remove it or record a documented exception. The list register SHOULD include owner, contact details, service description, criticality, and data sensitivity (which classifications are processed). Review provider information at least annually.',
        requirementAr:
      'تحفظ الجهة قائمة بالبرمجيات المصرح بها بما في ذلك عائلات الإصدارات، وقائمة بمزودي الخدمة بما في ذلك الخدمات السحابية والبرمجيات كخدمة، وتراجع الأنظمة شهريا على الأقل بحثا عن برمجيات غير مصرح بها فتزيلها أو تسجل لها استثناء موثقا، وينبغي أن يتضمن السجل المالك وبيانات الاتصال ووصف الخدمة ودرجة الحرجية وحساسية البيانات أي التصنيفات التي تعالج، وتراجع معلومات المزودين سنويا على الأقل.',
checks: [
      'A list of authorized software is maintained.',
      'The software list records version families.',
      'A list of service providers is maintained and includes cloud and SaaS.',
      'Systems are reviewed at least monthly for unauthorized software.',
      'Unauthorized software found is removed or covered by a documented exception.',
      'The register records an owner for each entry.',
      'The register records contact details for each entry.',
      'The register records a service description for each entry.',
      'The register records criticality for each entry.',
      'The register records which data classifications are processed.',
      'Provider information is reviewed at least annually.'
    ],
    checksAr: [
      'تحفظ قائمة بالبرمجيات المصرح بها.',
      'تسجل قائمة البرمجيات عائلات الإصدارات.',
      'تحفظ قائمة بمزودي الخدمة تشمل الخدمات السحابية والبرمجيات كخدمة.',
      'تراجع الأنظمة شهريا على الأقل بحثا عن برمجيات غير مصرح بها.',
      'تزال البرمجيات غير المصرح بها المكتشفة أو يغطيها استثناء موثق.',
      'يبين السجل مالكا لكل مدخل.',
      'يبين السجل بيانات اتصال لكل مدخل.',
      'يبين السجل وصفا للخدمة لكل مدخل.',
      'يبين السجل درجة الحرجية لكل مدخل.',
      'يبين السجل تصنيفات البيانات التي تعالج.',
      'تراجع معلومات المزودين سنويا على الأقل.'
    ],
    evidence: [
      'Authorized software list with version families',
      'Monthly unauthorized software scan reports and dispositions',
      'Provider register with the five register fields populated',
      'Dated annual provider review record'
    ],
    evidenceAr: [
      'قائمة البرمجيات المصرح بها مع عائلات الإصدارات',
      'تقارير الفحص الشهري للبرمجيات غير المصرح بها والإجراءات المتخذة',
      'سجل المزودين مستوفيا الحقول الخمسة',
      'محضر مؤرخ للمراجعة السنوية للمزودين'
    ],
    cadence: 'monthly',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['ID.AM-02', 'GV.SC-04'], cis: ['2.1', '2.3', '15.1'] }
  },
  {
    id: 'ID-3',
    fn: 'ID',
    title: 'Data & Account Inventory',
    titleAr: 'حصر البيانات والحسابات',
    purpose: 'Understand what data and accounts exist and who owns them.',
    purposeAr: 'إدراك البيانات والحسابات الموجودة ومعرفة مالكيها.',
    purposeSource: 'annex',
    requirement:
      'Maintain an inventory of critical and sensitive data sets, including classification, location, and business owner. Maintain an inventory of user and service accounts including privileges and last activity. Review accounts at least quarterly. Disable or remove dormant interactive user accounts that have not been used for 90 days, where the technology supports it. Review service accounts at least quarterly to validate continued business need. Ensure high-risk or privileged accounts are clearly identified.',
        requirementAr:
      'تحفظ الجهة حصرا لمجموعات البيانات الحرجة والحساسة يتضمن التصنيف والموقع والمالك من جهة الأعمال، وحصرا لحسابات المستخدمين وحسابات الخدمة يتضمن الصلاحيات وآخر نشاط، وتراجع الحسابات ربع سنويا على الأقل، وتعطل أو تزيل حسابات المستخدمين التفاعلية الخاملة التي لم تستخدم تسعين يوما متى كانت التقنية تدعم ذلك، وتراجع حسابات الخدمة ربع سنويا على الأقل للتحقق من استمرار الحاجة إليها، وتضمن تحديد الحسابات عالية الخطورة أو ذات الصلاحيات تحديدا واضحا.',
checks: [
      'An inventory of critical and sensitive data sets is maintained.',
      'Each data set record carries a classification.',
      'Each data set record carries a location.',
      'Each data set record carries a business owner.',
      'An inventory of user and service accounts is maintained.',
      'Account records capture privileges.',
      'Account records capture last activity.',
      'Accounts are reviewed at least quarterly.',
      'Dormant interactive user accounts unused for 90 days are disabled or removed where supported.',
      'Service accounts are reviewed at least quarterly to validate continued business need.',
      'High risk and privileged accounts are clearly identified.'
    ],
    checksAr: [
      'يحفظ حصر لمجموعات البيانات الحرجة والحساسة.',
      'يحمل كل سجل مجموعة بيانات تصنيفا.',
      'يحمل كل سجل مجموعة بيانات موقعا.',
      'يحمل كل سجل مجموعة بيانات مالكا من جهة الأعمال.',
      'يحفظ حصر لحسابات المستخدمين وحسابات الخدمة.',
      'تبين سجلات الحسابات الصلاحيات.',
      'تبين سجلات الحسابات آخر نشاط.',
      'تراجع الحسابات ربع سنويا على الأقل.',
      'تعطل حسابات المستخدمين التفاعلية الخاملة تسعين يوما أو تزال حيثما أمكن.',
      'تراجع حسابات الخدمة ربع سنويا على الأقل للتحقق من استمرار الحاجة إليها.',
      'الحسابات عالية الخطورة وذات الصلاحيات محددة بوضوح.'
    ],
    evidence: [
      'Data set inventory export with classification, location and owner',
      'Account inventory export with privilege and last logon columns',
      'Quarterly account review sign off',
      'Report of accounts disabled under the 90 day dormancy rule'
    ],
    evidenceAr: [
      'تصدير حصر مجموعات البيانات مع التصنيف والموقع والمالك',
      'تصدير حصر الحسابات مع أعمدة الصلاحيات وآخر دخول',
      'اعتماد المراجعة ربع السنوية للحسابات',
      'تقرير الحسابات المعطلة وفق قاعدة الخمول تسعين يوما'
    ],
    cadence: 'quarterly',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['ID.AM-07', 'PR.AA-01', 'PR.AA-05'], cis: ['3.1', '5.1', '5.3'] }
  }
];

