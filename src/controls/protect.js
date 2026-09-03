// PROTECT (PR) controls of the Kuwait NBCC baseline.

export const PROTECT = [
  {
    id: 'PR-1',
    fn: 'PR',
    title: 'Secure Configuration, Hardening & Network Segmentation',
    titleAr: 'التهيئة الآمنة والتحصين وتجزئة الشبكة',
    purpose: 'Reduce the attack surface of systems and devices.',
    purposeAr: 'تقليص سطح الهجوم على الأنظمة والأجهزة.',
    purposeSource: 'annex',
    requirement:
      'Establish hardened configuration baselines for servers, workstations, network devices, and key applications. From this baseline, disable or remove services, features and ports that are not needed for the system\u2019s role. Change or disable default accounts and default passwords. Enable a host-based firewall on endpoints and servers and allow only the network traffic required for normal operation. Review configurations at least annually and after major changes.',
        requirementAr:
      'تضع الجهة إعدادات مرجعية محصنة للخوادم ومحطات العمل وأجهزة الشبكة والتطبيقات الرئيسية، وتعطل أو تزيل انطلاقا من هذه الإعدادات الخدمات والخصائص والمنافذ غير اللازمة لدور النظام، وتغير أو تعطل الحسابات وكلمات المرور الافتراضية، وتفعل جدار حماية على مستوى المضيف في الأجهزة الطرفية والخوادم لا يسمح إلا بحركة البيانات اللازمة للتشغيل الطبيعي، وتراجع الإعدادات سنويا على الأقل وبعد التغييرات الجوهرية.',
checks: [
      'Hardened configuration baselines exist for servers.',
      'Hardened configuration baselines exist for workstations.',
      'Hardened configuration baselines exist for network devices.',
      'Hardened configuration baselines exist for key applications.',
      'Services and features not needed for the system role are disabled or removed.',
      'Ports not needed for the system role are disabled or removed.',
      'Default accounts are changed or disabled.',
      'Default passwords are changed or disabled.',
      'A host based firewall is enabled on endpoints and servers.',
      'Host firewall rules allow only the traffic required for normal operation.',
      'Configurations are reviewed at least annually.',
      'Configurations are reviewed after major changes.'
    ],
    checksAr: [
      'توجد إعدادات مرجعية محصنة للخوادم.',
      'توجد إعدادات مرجعية محصنة لمحطات العمل.',
      'توجد إعدادات مرجعية محصنة لأجهزة الشبكة.',
      'توجد إعدادات مرجعية محصنة للتطبيقات الرئيسية.',
      'الخدمات والخصائص غير اللازمة لدور النظام معطلة أو مزالة.',
      'المنافذ غير اللازمة لدور النظام معطلة أو مزالة.',
      'الحسابات الافتراضية مغيرة أو معطلة.',
      'كلمات المرور الافتراضية مغيرة أو معطلة.',
      'جدار حماية على مستوى المضيف مفعل على الأجهزة الطرفية والخوادم.',
      'قواعد جدار حماية المضيف تسمح فقط بحركة البيانات اللازمة للتشغيل الطبيعي.',
      'تراجع الإعدادات سنويا على الأقل.',
      'تراجع الإعدادات عقب التغييرات الجوهرية.'
    ],
    evidence: [
      'Documented baseline per platform with the hardening decisions recorded',
      'Build checklist or golden image showing services and ports removed',
      'Report confirming no default credentials remain in use',
      'Host firewall policy export from a sample of endpoints and servers',
      'Dated configuration review record'
    ],
    evidenceAr: [
      'إعداد مرجعي موثق لكل منصة مع تسجيل قرارات التحصين',
      'قائمة تحقق البناء أو النسخة القياسية تبين الخدمات والمنافذ المزالة',
      'تقرير يؤكد عدم بقاء أي بيانات اعتماد افتراضية قيد الاستخدام',
      'تصدير سياسة جدار حماية المضيف من عينة من الأجهزة الطرفية والخوادم',
      'محضر مؤرخ لمراجعة الإعدادات'
    ],
    cadence: 'annual',
    effort: 'high',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['PR.PS-01', 'PR.IR-01'], cis: ['4.1', '4.2', '4.4', '4.5', '4.6', '4.7', '4.8'] }
  },
  {
    id: 'PR-1.1',
    fn: 'PR',
    title: 'Network Segmentation',
    titleAr: 'تجزئة الشبكة',
    purpose: 'Limit the spread and impact of attacks by separating networks.',
    purposeAr: 'الحد من انتشار الهجمات وأثرها عبر الفصل بين الشبكات.',
    purposeSource: 'annex',
    requirement:
      'Where feasible, separate user networks from server/data networks, and keep management/admin interfaces on a more restricted network segment. Place internet-facing systems in a more controlled network zone. Avoid direct access from user networks to sensitive servers unless explicitly required and approved.\n' +
      '• Do not treat network location alone as sufficient basis for trust. Access to management/admin interfaces and Critical Systems MUST be explicitly authorized based on least privilege and protected with strong authentication in accordance with PR-2 (including MFA for administrative access where supported).\n' +
      '• Document such access and review it at least annually.',
        requirementAr:
      'تفصل الجهة متى أمكن شبكات المستخدمين عن شبكات الخوادم والبيانات، وتبقي واجهات الإدارة في مقطع شبكي أكثر تقييدا، وتضع الأنظمة المتصلة بالإنترنت في منطقة شبكية أكثر ضبطا، وتتجنب الوصول المباشر من شبكات المستخدمين إلى الخوادم الحساسة ما لم يكن مطلوبا ومعتمدا صراحة.\n' +
      '• ولا يعد الموقع الشبكي وحده أساسا كافيا للثقة، إذ يجب اعتماد الوصول إلى واجهات الإدارة والأنظمة الحرجة اعتمادا صريحا قائما على أقل الصلاحيات وحمايته بمصادقة قوية وفق الضابط PR-2 بما في ذلك المصادقة متعددة العوامل للوصول الإداري حيثما كانت مدعومة.\n' +
      '• ويوثق هذا الوصول ويراجع سنويا على الأقل.',
checks: [
      'User networks are separated from server and data networks where feasible.',
      'Management and admin interfaces sit on a more restricted network segment.',
      'Internet facing systems are placed in a more controlled network zone.',
      'Direct access from user networks to sensitive servers is avoided unless explicitly required and approved.',
      'Network location alone is not treated as sufficient basis for trust.',
      'Access to management and admin interfaces is explicitly authorized on least privilege.',
      'Access to Critical Systems is explicitly authorized on least privilege.',
      'Strong authentication protects management and admin access in line with PR-2.',
      'MFA protects administrative access where supported.',
      'Such access is documented.',
      'Such access is reviewed at least annually.'
    ],
    checksAr: [
      'شبكات المستخدمين مفصولة عن شبكات الخوادم والبيانات متى أمكن.',
      'واجهات الإدارة موضوعة في مقطع شبكي أكثر تقييدا.',
      'الأنظمة المتصلة بالإنترنت موضوعة في منطقة شبكية أكثر ضبطا.',
      'الوصول المباشر من شبكات المستخدمين إلى الخوادم الحساسة متجنب ما لم يكن مطلوبا ومعتمدا صراحة.',
      'الموقع الشبكي وحده لا يعد أساسا كافيا للثقة.',
      'الوصول إلى واجهات الإدارة معتمد صراحة على أساس أقل الصلاحيات.',
      'الوصول إلى الأنظمة الحرجة معتمد صراحة على أساس أقل الصلاحيات.',
      'مصادقة قوية تحمي الوصول الإداري بما يتفق مع الضابط PR-2.',
      'المصادقة متعددة العوامل تحمي الوصول الإداري حيثما كان مدعوما.',
      'هذا الوصول موثق.',
      'هذا الوصول يراجع سنويا على الأقل.'
    ],
    evidence: [
      'Network diagram showing user, server, management and internet facing zones',
      'Firewall or ACL rule set enforcing the separation',
      'Authorization register for management interface and Critical System access',
      'Annual access review sign off'
    ],
    evidenceAr: [
      'مخطط شبكي يبين مناطق المستخدمين والخوادم والإدارة والاتصال بالإنترنت',
      'مجموعة قواعد جدار الحماية أو قوائم التحكم التي تفرض الفصل',
      'سجل اعتماد الوصول إلى واجهات الإدارة والأنظمة الحرجة',
      'اعتماد المراجعة السنوية للوصول'
    ],
    cadence: 'annual',
    effort: 'high',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['PR.IR-01', 'PR.AA-05'], cis: ['12.2', '4.6', '13.4'] }
  },
  {
    id: 'PR-1.2',
    fn: 'PR',
    title: 'Vulnerability Management & Patching',
    titleAr: 'إدارة الثغرات والتحديثات الأمنية',
    purpose: 'Identify and address technical weaknesses in a structured way.',
    purposeAr: 'اكتشاف نقاط الضعف التقنية ومعالجتها بأسلوب منهجي.',
    purposeSource: 'annex',
    requirement:
      'Have a simple written process for vulnerability management and review it at least annually. Run automated vulnerability scans on key systems: at least monthly for internet-facing systems, at least quarterly for other important internal systems, and after major changes. After each scan, review the report, produce a short action list, and fix the most serious issues first (for example, high and critical findings). Aim to apply operating system and application patches at least monthly on supported systems. Keep records of scans and key remediation actions.',
        requirementAr:
      'تعتمد الجهة آلية مكتوبة مبسطة لإدارة الثغرات وتراجعها سنويا على الأقل، وتجري فحوصا آلية للثغرات على الأنظمة الرئيسية بواقع شهري على الأقل للأنظمة المتصلة بالإنترنت وربع سنوي على الأقل لسائر الأنظمة الداخلية المهمة وكذلك بعد التغييرات الجوهرية، وتراجع بعد كل فحص تقريره وتعد قائمة إجراءات موجزة وتعالج أخطر المسائل أولا كالنتائج العالية والحرجة، وتسعى إلى تطبيق تحديثات أنظمة التشغيل والتطبيقات شهريا على الأقل على الأنظمة المدعومة، وتحفظ سجلات الفحوص وإجراءات المعالجة الرئيسية.',
checks: [
      'A written vulnerability management process exists.',
      'The process is reviewed at least annually.',
      'Automated vulnerability scans run at least monthly on internet facing systems.',
      'Automated vulnerability scans run at least quarterly on other important internal systems.',
      'Scans are run after major changes.',
      'Each scan report is reviewed.',
      'A short action list is produced after each scan.',
      'High and critical findings are prioritized for fixing.',
      'Operating system patches are applied at least monthly on supported systems.',
      'Application patches are applied at least monthly on supported systems.',
      'Records of scans are retained.',
      'Records of key remediation actions are retained.'
    ],
    checksAr: [
      'توجد آلية مكتوبة لإدارة الثغرات.',
      'تراجع الآلية سنويا على الأقل.',
      'تجرى فحوص الثغرات الآلية شهريا على الأقل للأنظمة المتصلة بالإنترنت.',
      'تجرى فحوص الثغرات الآلية ربع سنويا على الأقل لسائر الأنظمة الداخلية المهمة.',
      'تجرى الفحوص عقب التغييرات الجوهرية.',
      'كل تقرير فحص يراجع.',
      'تعد قائمة إجراءات موجزة عقب كل فحص.',
      'تعطى النتائج العالية والحرجة أولوية المعالجة.',
      'تطبق تحديثات أنظمة التشغيل شهريا على الأقل على الأنظمة المدعومة.',
      'تطبق تحديثات التطبيقات شهريا على الأقل على الأنظمة المدعومة.',
      'سجلات الفحوص محفوظة.',
      'سجلات إجراءات المعالجة الرئيسية محفوظة.'
    ],
    evidence: [
      'Vulnerability management procedure with review date',
      'Scan schedule and last twelve months of scan reports',
      'Remediation tracker showing findings, owners and closure dates',
      'Patch compliance report per monthly cycle'
    ],
    evidenceAr: [
      'إجراء إدارة الثغرات مع تاريخ المراجعة',
      'جدول الفحوص وتقارير آخر اثني عشر شهرا',
      'سجل متابعة المعالجة يبين النتائج والمسؤولين وتواريخ الإغلاق',
      'تقرير الالتزام بالتحديثات لكل دورة شهرية'
    ],
    cadence: 'monthly',
    effort: 'high',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['ID.RA-01', 'ID.RA-06', 'PR.PS-02'], cis: ['7.1', '7.3', '7.4', '7.5', '7.6'] }
  },
  {
    id: 'PR-2',
    fn: 'PR',
    title: 'Identity, Authentication & Password Hygiene',
    titleAr: 'الهوية والمصادقة وسلامة كلمات المرور',
    purpose: 'Ensure access is properly controlled and accounts are harder to compromise.',
    purposeAr: 'ضمان ضبط الوصول على نحو سليم وجعل اختراق الحسابات أصعب.',
    purposeSource: 'annex',
    requirement:
      'Require unique passwords for all accounts; do not reuse the same password across different systems. As a simple rule, require at least 8 characters for accounts protected by multi-factor authentication (MFA) and at least 14 characters for accounts without MFA. Avoid forcing regular password changes unless compromise is suspected. Enforce session lock or screen saver after 15 minutes of inactivity for workstations and around 2 minutes for mobile devices where practical. Limit administrator privileges to dedicated admin accounts, and require staff to perform day-to-day activities (email, web browsing, office work) from a normal user account. Implement MFA for all remote network access, externally exposed applications, and privileged/admin accounts where supported, using at least two different types of factor (something you know, something you have, something you are).',
        requirementAr:
      'تشترط الجهة كلمات مرور فريدة لجميع الحسابات دون إعادة استخدام كلمة المرور نفسها عبر أنظمة مختلفة، وكقاعدة مبسطة تشترط ثمانية محارف على الأقل للحسابات المحمية بالمصادقة متعددة العوامل وأربعة عشر محرفا على الأقل للحسابات غير المحمية بها، وتتجنب فرض تغيير دوري لكلمات المرور ما لم يشتبه في اختراق، وتفرض قفل الجلسة أو شاشة التوقف بعد خمس عشرة دقيقة من الخمول في محطات العمل ونحو دقيقتين في الأجهزة المحمولة متى كان ذلك عمليا، وتقصر صلاحيات المدير على حسابات إدارية مخصصة وتلزم الموظفين بأداء أعمالهم اليومية من بريد وتصفح وأعمال مكتبية من حساب مستخدم عادي، وتطبق المصادقة متعددة العوامل على كل وصول شبكي عن بعد وعلى التطبيقات المكشوفة خارجيا وعلى الحسابات ذات الصلاحيات والحسابات الإدارية حيثما كانت مدعومة، على أن تستخدم نوعين مختلفين على الأقل من العوامل أي شيء تعرفه وشيء تملكه وشيء تكونه.',
checks: [
      'Unique passwords are required for all accounts.',
      'Password reuse across different systems is prohibited.',
      'Accounts protected by MFA require at least 8 characters.',
      'Accounts without MFA require at least 14 characters.',
      'Regular forced password changes are avoided unless compromise is suspected.',
      'Workstations lock the session after 15 minutes of inactivity.',
      'Mobile devices lock after around 2 minutes of inactivity where practical.',
      'Administrator privileges are limited to dedicated admin accounts.',
      'Staff perform day to day activities from a normal user account.',
      'MFA is implemented for all remote network access.',
      'MFA is implemented for externally exposed applications.',
      'MFA is implemented for privileged and admin accounts where supported.',
      'MFA uses at least two different types of factor.'
    ],
    checksAr: [
      'كلمات مرور فريدة مطلوبة لجميع الحسابات.',
      'إعادة استخدام كلمات المرور عبر أنظمة مختلفة محظورة.',
      'تتطلب الحسابات المحمية بالمصادقة متعددة العوامل ثمانية محارف على الأقل.',
      'تتطلب الحسابات غير المحمية بالمصادقة متعددة العوامل أربعة عشر محرفا على الأقل.',
      'التغيير الدوري الإجباري لكلمات المرور متجنب ما لم يشتبه في اختراق.',
      'تقفل محطات العمل الجلسة بعد خمس عشرة دقيقة من الخمول.',
      'تقفل الأجهزة المحمولة بعد نحو دقيقتين من الخمول حيثما كان ذلك عمليا.',
      'صلاحيات المدير مقصورة على حسابات إدارية مخصصة.',
      'الموظفون يؤدون أعمالهم اليومية من حساب مستخدم عادي.',
      'المصادقة متعددة العوامل مطبقة على كل وصول شبكي عن بعد.',
      'المصادقة متعددة العوامل مطبقة على التطبيقات المكشوفة خارجيا.',
      'المصادقة متعددة العوامل مطبقة على الحسابات ذات الصلاحيات والحسابات الإدارية حيثما كانت مدعومة.',
      'تستخدم المصادقة متعددة العوامل نوعين مختلفين على الأقل من العوامل.'
    ],
    evidence: [
      'Password policy configuration export from the directory service',
      'Screen lock policy from endpoint management',
      'List of privileged accounts showing separation from daily use accounts',
      'MFA enrolment report covering remote access, exposed applications and admins'
    ],
    evidenceAr: [
      'تصدير إعداد سياسة كلمات المرور من خدمة الدليل',
      'سياسة قفل الشاشة من نظام إدارة الأجهزة الطرفية',
      'قائمة الحسابات ذات الصلاحيات تبين فصلها عن حسابات الاستخدام اليومي',
      'تقرير تسجيل المصادقة متعددة العوامل يغطي الوصول عن بعد والتطبيقات المكشوفة والمديرين'
    ],
    cadence: 'continuous',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['PR.AA-01', 'PR.AA-02', 'PR.AA-03', 'PR.AA-05'], cis: ['5.2', '5.4', '6.3', '6.4', '6.5'] }
  },
  {
    id: 'PR-2.1',
    fn: 'PR',
    title: 'Corporate Email Only & Personal Email Ban',
    titleAr: 'قصر المراسلات على البريد المؤسسي ومنع البريد الشخصي',
    purpose:
      'Ensure work communications use managed, auditable channels and reduce data leakage via personal email.',
    purposeAr:
      'ضمان جريان مراسلات العمل عبر قنوات مُدارة قابلة للتدقيق والحد من تسرب البيانات عبر البريد الشخصي.',
    purposeSource: 'annex',
    requirement:
      'Require that all official business communications use only Entity-approved corporate email accounts on approved domains. Personal/consumer email accounts MUST NOT be configured on corporate devices and MUST NOT be used for work-related communication. Enforce this via (1) an acceptable use policy, and (2) device and email configuration (e.g., MDM or mail client settings) that prevent adding personal accounts where feasible.',
        requirementAr:
      'تشترط الجهة أن تجري كل مراسلات العمل الرسمية عبر حسابات بريد مؤسسي معتمدة منها وعلى نطاقات معتمدة، ولا يجوز تهيئة حسابات البريد الشخصي أو الاستهلاكي على أجهزة الجهة ولا استخدامها في المراسلات المتعلقة بالعمل، ويفرض ذلك أولا بسياسة للاستخدام المقبول وثانيا بإعدادات الأجهزة والبريد كنظام إدارة الأجهزة أو إعدادات عميل البريد بما يمنع إضافة الحسابات الشخصية متى أمكن.',
checks: [
      'All official business communication uses entity approved corporate email accounts.',
      'Corporate email runs on approved domains.',
      'Personal or consumer email accounts are not configured on corporate devices.',
      'Personal or consumer email accounts are not used for work related communication.',
      'An acceptable use policy states the requirement.',
      'Device and email configuration prevents adding personal accounts where feasible.'
    ],
    checksAr: [
      'تستخدم كل مراسلات العمل الرسمية حسابات بريد مؤسسي معتمدة من الجهة.',
      'يعمل البريد المؤسسي على نطاقات معتمدة.',
      'حسابات البريد الشخصي أو الاستهلاكي غير مهيأة على أجهزة الجهة.',
      'لا تستخدم حسابات البريد الشخصي أو الاستهلاكي في المراسلات المتعلقة بالعمل.',
      'سياسة الاستخدام المقبول تنص على هذا الاشتراط.',
      'تمنع إعدادات الأجهزة والبريد إضافة الحسابات الشخصية متى أمكن.'
    ],
    evidence: [
      'Acceptable use policy clause on corporate email',
      'MDM or mail client profile blocking personal account enrolment',
      'Approved mail domain list',
      'Exception records where the technical control cannot be applied'
    ],
    evidenceAr: [
      'بند سياسة الاستخدام المقبول الخاص بالبريد المؤسسي',
      'ملف إدارة الأجهزة أو عميل البريد الذي يمنع تسجيل الحسابات الشخصية',
      'قائمة نطاقات البريد المعتمدة',
      'سجلات الاستثناء حيث يتعذر تطبيق الضابط التقني'
    ],
    cadence: 'continuous',
    effort: 'low',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['PR.DS-02', 'GV.PO-01'], cis: ['9.1', '14.1'] }
  },
  {
    id: 'PR-2.2',
    fn: 'PR',
    title: 'Password Manager & Credential Hygiene',
    titleAr: 'مدير كلمات المرور وسلامة بيانات الاعتماد',
    purpose: 'Help staff maintain strong, unique passwords without reuse.',
    purposeAr: 'مساعدة الموظفين على استخدام كلمات مرور قوية وفريدة دون تكرار.',
    purposeSource: 'annex',
    requirement:
      'Provide or approve a password-manager-style solution for staff who manage multiple credentials. Encourage use of long, unique passwords generated by the manager for each system. For shared/team accounts (where unavoidable), use shared password vaults or similar capabilities; do not share passwords through email, chat, or on paper.',
        requirementAr:
      'توفر الجهة أو تعتمد حلا من نوع مدير كلمات المرور للموظفين الذين يديرون بيانات اعتماد متعددة، وتشجع استخدام كلمات مرور طويلة وفريدة يولدها المدير لكل نظام، وتستخدم للحسابات المشتركة أو حسابات الفرق عند تعذر تجنبها خزائن كلمات مرور مشتركة أو قدرات مماثلة، ولا تتبادل كلمات المرور عبر البريد الإلكتروني أو المحادثات أو على الورق.',
checks: [
      'A password manager style solution is provided or approved for staff managing multiple credentials.',
      'Long unique generated passwords are encouraged for each system.',
      'Shared or team accounts use a shared password vault or similar capability.',
      'Passwords are not shared through email.',
      'Passwords are not shared through chat.',
      'Passwords are not shared on paper.'
    ],
    checksAr: [
      'يوفر أو يعتمد حل من نوع مدير كلمات المرور للموظفين الذين يديرون بيانات اعتماد متعددة.',
      'يشجع استخدام كلمات مرور طويلة وفريدة ومولدة لكل نظام.',
      'تستخدم الحسابات المشتركة أو حسابات الفرق خزانة كلمات مرور مشتركة أو قدرة مماثلة.',
      'كلمات المرور لا تتبادل عبر البريد الإلكتروني.',
      'كلمات المرور لا تتبادل عبر المحادثات.',
      'كلمات المرور لا تتبادل على الورق.'
    ],
    evidence: [
      'Approved password manager in the software inventory with licence coverage',
      'Vault configuration for shared team credentials',
      'Awareness material covering credential sharing prohibitions',
      'Rollout record for staff in credential heavy roles'
    ],
    evidenceAr: [
      'مدير كلمات المرور المعتمد مدرجا في حصر البرمجيات مع تغطية الترخيص',
      'إعداد الخزانة الخاصة ببيانات الاعتماد المشتركة بين الفرق',
      'مواد توعوية تغطي حظر تبادل بيانات الاعتماد',
      'محضر التعميم على الموظفين في الأدوار كثيفة بيانات الاعتماد'
    ],
    cadence: 'continuous',
    effort: 'low',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['PR.AA-01', 'PR.AT-01'], cis: ['5.2', '14.1'] }
  },
  {
    id: 'PR-3',
    fn: 'PR',
    title: 'Awareness & Human Factors',
    titleAr: 'التوعية والعوامل البشرية',
    purpose: 'Build a basic culture of secure behavior.',
    purposeAr: 'بناء ثقافة أساسية للسلوك الآمن.',
    purposeSource: 'annex',
    requirement:
      'Establish a security awareness program and provide training at least annually and for new joiners. At minimum, cover: social engineering and phishing, safe use of email and the web, handling of Sensitive and Restricted data, password and MFA hygiene, use of approved communication tools, use of portable media, and how to report suspicious activity or incidents. Use simple language and relevant examples.',
        requirementAr:
      'تنشئ الجهة برنامجا للتوعية الأمنية وتقدم التدريب سنويا على الأقل وللموظفين الجدد، ويغطي كحد أدنى الهندسة الاجتماعية والتصيد والاستخدام الآمن للبريد الإلكتروني والإنترنت والتعامل مع البيانات الحساسة والمقيدة وسلامة كلمات المرور والمصادقة متعددة العوامل واستخدام أدوات التواصل المعتمدة واستخدام وسائط التخزين الخارجية وكيفية الإبلاغ عن النشاط المشبوه أو الحوادث، وتستخدم في ذلك لغة بسيطة وأمثلة ذات صلة.',
checks: [
      'A security awareness program is established.',
      'Training is delivered at least annually.',
      'Training is delivered to new joiners.',
      'Training covers social engineering and phishing.',
      'Training covers safe use of email and the web.',
      'Training covers handling of Sensitive and Restricted data.',
      'Training covers password and MFA hygiene.',
      'Training covers use of approved communication tools.',
      'Training covers use of portable media.',
      'Training covers how to report suspicious activity or incidents.',
      'Material uses simple language and relevant examples.'
    ],
    checksAr: [
      'يوجد برنامج للتوعية الأمنية.',
      'التدريب يقدم سنويا على الأقل.',
      'التدريب يقدم للموظفين الجدد.',
      'يغطي التدريب الهندسة الاجتماعية والتصيد.',
      'يغطي التدريب الاستخدام الآمن للبريد الإلكتروني والإنترنت.',
      'يغطي التدريب التعامل مع البيانات الحساسة والمقيدة.',
      'يغطي التدريب سلامة كلمات المرور والمصادقة متعددة العوامل.',
      'يغطي التدريب استخدام أدوات التواصل المعتمدة.',
      'يغطي التدريب استخدام وسائط التخزين الخارجية.',
      'يغطي التدريب كيفية الإبلاغ عن النشاط المشبوه أو الحوادث.',
      'تستخدم المواد لغة بسيطة وأمثلة ذات صلة.'
    ],
    evidence: [
      'Awareness program plan and content outline mapped to the seven required topics',
      'Attendance and completion records for the current year',
      'New joiner induction record showing security training',
      'Sample training material in the working language of staff'
    ],
    evidenceAr: [
      'خطة برنامج التوعية وموجز محتواه مقابلا للموضوعات السبعة المطلوبة',
      'سجلات الحضور والإتمام للسنة الحالية',
      'محضر تعريف الموظفين الجدد يبين التدريب الأمني',
      'عينة من المواد التدريبية بلغة عمل الموظفين'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['PR.AT-01', 'PR.AT-02'], cis: ['14.1', '14.2', '14.3', '14.6'] }
  },
  {
    id: 'PR-3.1',
    fn: 'PR',
    title: 'Official Social Media & Digital Presence',
    titleAr: 'الحسابات الرسمية والحضور الرقمي',
    purpose:
      'Ensure official accounts are authentic, protected, and clearly distinguished from impostors.',
    purposeAr:
      'ضمان أصالة الحسابات الرسمية وحمايتها وتمييزها بوضوح عن الحسابات المنتحلة.',
    purposeSource: 'annex',
    requirement:
      'Maintain a central register of official Entity accounts on external platforms (e.g., major social networks, video platforms). Create official accounts using corporate email addresses and appropriate naming conventions. Where the platform provides it and criteria are met, enable verification or "official" status. Protect these accounts with MFA and role-based administration; review access at least annually and remove access when staff leave or change roles.',
        requirementAr:
      'تحفظ الجهة سجلا مركزيا لحساباتها الرسمية على المنصات الخارجية كشبكات التواصل ومنصات الفيديو الكبرى، وتنشئ الحسابات الرسمية باستخدام عناوين بريد مؤسسي وأعراف تسمية مناسبة، وتفعل التوثيق أو صفة الحساب الرسمي حيثما توفرها المنصة واستوفيت شروطها، وتحمي هذه الحسابات بالمصادقة متعددة العوامل وتديرها وفق الأدوار، وتراجع الوصول إليها سنويا على الأقل وتزيله عند مغادرة الموظفين أو تغير أدوارهم.',
checks: [
      'A central register of official entity accounts on external platforms is maintained.',
      'Official accounts are created using corporate email addresses.',
      'Official accounts follow appropriate naming conventions.',
      'Verification or official status is enabled where the platform provides it and criteria are met.',
      'Official accounts are protected with MFA.',
      'Official accounts use role based administration.',
      'Access to official accounts is reviewed at least annually.',
      'Access is removed when staff leave or change roles.'
    ],
    checksAr: [
      'يحفظ سجل مركزي لحسابات الجهة الرسمية على المنصات الخارجية.',
      'الحسابات الرسمية تنشأ باستخدام عناوين بريد مؤسسي.',
      'تتبع الحسابات الرسمية أعرافا مناسبة في التسمية.',
      'التوثيق أو صفة الحساب الرسمي مفعلة حيثما توفرها المنصة واستوفيت شروطها.',
      'الحسابات الرسمية محمية بالمصادقة متعددة العوامل.',
      'تدار الحسابات الرسمية وفق الأدوار.',
      'الوصول إلى الحسابات الرسمية يراجع سنويا على الأقل.',
      'الوصول يزال عند مغادرة الموظف أو تغير دوره.'
    ],
    evidence: [
      'Register of official accounts with platform, handle, owner and admin list',
      'MFA status screenshot per official account',
      'Annual access review record',
      'Leaver checklist entry covering social account access removal'
    ],
    evidenceAr: [
      'سجل الحسابات الرسمية يبين المنصة والمعرف والمالك وقائمة المديرين',
      'لقطة تبين حالة المصادقة متعددة العوامل لكل حساب رسمي',
      'محضر المراجعة السنوية للوصول',
      'بند في قائمة تحقق المغادرة يغطي إزالة الوصول إلى حسابات التواصل'
    ],
    cadence: 'annual',
    effort: 'low',
    phase: 2,
    appliesWhen: ['hasPublicAccounts'],
    crosswalk: { csf: ['PR.AA-05', 'ID.AM-02'], cis: ['5.1', '6.5'] }
  },
  {
    id: 'PR-4',
    fn: 'PR',
    title: 'Malware, Email & Web Protection',
    titleAr: 'الحماية من البرمجيات الخبيثة وحماية البريد والويب',
    purpose: 'Reduce the risk of malware and phishing attacks.',
    purposeAr: 'تقليل مخاطر البرمجيات الخبيثة وهجمات التصيد.',
    purposeSource: 'annex',
    requirement:
      'Deploy endpoint protection (e.g., anti-malware/EDR software) on supported servers and workstations with automatic updates and centralized alerting where possible. Use email and web security controls (e.g., spam filtering, attachment and URL filtering) to block common malicious content and clearly suspicious file types. Configure email systems to block or warn on dangerous file extensions that are not needed for business and to limit very large attachments according to business need. Configure email domains with appropriate anti-spoofing controls (SPF, DKIM, DMARC) to prevent impersonation. Train staff to be cautious with unexpected links and attachments, and to report suspicious messages.',
        requirementAr:
      'تنشر الجهة حلول حماية الأجهزة الطرفية كبرمجيات مكافحة البرمجيات الخبيثة أو الكشف والاستجابة على الخوادم ومحطات العمل المدعومة مع تحديث تلقائي وتنبيه مركزي متى أمكن، وتستخدم ضوابط أمن البريد والويب كترشيح الرسائل المزعجة والمرفقات والروابط لحجب المحتوى الخبيث الشائع وأنواع الملفات المشبوهة بوضوح، وتهيئ أنظمة البريد لحجب امتدادات الملفات الخطرة غير اللازمة للعمل أو التنبيه عليها ولتحديد المرفقات الكبيرة جدا وفق حاجة العمل، وتهيئ نطاقات البريد بضوابط مناسبة لمنع الانتحال هي SPF وDKIM وDMARC، وتدرب الموظفين على الحذر من الروابط والمرفقات غير المتوقعة وعلى الإبلاغ عن الرسائل المشبوهة.',
checks: [
      'Endpoint protection is deployed on supported servers.',
      'Endpoint protection is deployed on supported workstations.',
      'Endpoint protection signatures and engines update automatically.',
      'Centralized alerting is in place where possible.',
      'Email security controls block common malicious content.',
      'Web security controls block common malicious content.',
      'Email systems block or warn on dangerous file extensions not needed for business.',
      'Very large attachments are limited according to business need.',
      'SPF is configured on entity email domains.',
      'DKIM is configured on entity email domains.',
      'DMARC is configured on entity email domains.',
      'Staff are trained to be cautious with unexpected links and attachments.',
      'Staff are trained to report suspicious messages.'
    ],
    checksAr: [
      'حماية الأجهزة الطرفية منشورة على الخوادم المدعومة.',
      'حماية الأجهزة الطرفية منشورة على محطات العمل المدعومة.',
      'تحدث بصمات ومحركات حماية الأجهزة الطرفية تلقائيا.',
      'يوجد تنبيه مركزي حيثما أمكن.',
      'تحجب ضوابط أمن البريد المحتوى الخبيث الشائع.',
      'تحجب ضوابط أمن الويب المحتوى الخبيث الشائع.',
      'تحجب أنظمة البريد أو تنبه على امتدادات الملفات الخطرة غير اللازمة للعمل.',
      'المرفقات الكبيرة جدا محدودة وفق حاجة العمل.',
      'سجل SPF مهيأ على نطاقات بريد الجهة.',
      'سجل DKIM مهيأ على نطاقات بريد الجهة.',
      'سجل DMARC مهيأ على نطاقات بريد الجهة.',
      'الموظفون مدربون على الحذر من الروابط والمرفقات غير المتوقعة.',
      'الموظفون مدربون على الإبلاغ عن الرسائل المشبوهة.'
    ],
    evidence: [
      'Endpoint protection coverage report against the asset inventory',
      'Mail gateway policy showing attachment and URL filtering rules',
      'DNS records proving SPF, DKIM and DMARC on every sending domain',
      'Phishing reporting statistics or mailbox activity'
    ],
    evidenceAr: [
      'تقرير تغطية حماية الأجهزة الطرفية مقارنا بحصر الأصول',
      'سياسة بوابة البريد تبين قواعد ترشيح المرفقات والروابط',
      'سجلات نظام أسماء النطاقات تثبت تهيئة SPF وDKIM وDMARC على كل نطاق مرسل',
      'إحصاءات الإبلاغ عن التصيد أو نشاط صندوق البريد المخصص'
    ],
    cadence: 'continuous',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['PR.PS-05', 'DE.CM-01', 'PR.AT-01'], cis: ['9.2', '9.3', '9.6', '10.1', '10.2'] }
  },
  {
    id: 'PR-4.1',
    fn: 'PR',
    title: 'Approved Communication & Videoconferencing Platforms',
    titleAr: 'منصات التواصل والاجتماعات المرئية المعتمدة',
    purpose: 'Reduce risk from unapproved chat/voice/video tools and remote control apps.',
    purposeAr: 'تقليل المخاطر الناتجة عن أدوات المحادثة والصوت والفيديو والتحكم عن بعد غير المعتمدة.',
    purposeSource: 'annex',
    requirement:
      'For official work (meetings, calls, messaging, screen sharing), use only Entity-approved communication and collaboration platforms. Do not use personal or unapproved apps (for example, private messaging, personal email, unauthorized remote-control tools) for work data or meetings. Maintain a simple list of approved platforms and ensure staff are aware of it. Where feasible, restrict installation or use of unapproved tools on corporate devices via configuration.',
        requirementAr:
      'تستخدم الجهة في الأعمال الرسمية من اجتماعات ومكالمات ومراسلة ومشاركة للشاشة منصات التواصل والتعاون المعتمدة منها وحدها، ولا تستخدم التطبيقات الشخصية أو غير المعتمدة كالمراسلة الخاصة والبريد الشخصي وأدوات التحكم عن بعد غير المصرح بها في بيانات العمل أو اجتماعاته، وتحفظ قائمة مبسطة بالمنصات المعتمدة وتضمن علم الموظفين بها، وتقيد متى أمكن تثبيت الأدوات غير المعتمدة أو استخدامها على أجهزة الجهة عن طريق الإعدادات.',
checks: [
      'Only entity approved platforms are used for official meetings, calls, messaging and screen sharing.',
      'Personal or unapproved apps are not used for work data or meetings.',
      'Unauthorized remote control tools are not used for work.',
      'A list of approved platforms is maintained.',
      'Staff are made aware of the approved platform list.',
      'Installation or use of unapproved tools on corporate devices is restricted by configuration where feasible.'
    ],
    checksAr: [
      'تستخدم المنصات المعتمدة من الجهة وحدها للاجتماعات والمكالمات والمراسلة ومشاركة الشاشة الرسمية.',
      'لا تستخدم التطبيقات الشخصية أو غير المعتمدة لبيانات العمل أو اجتماعاته.',
      'لا تستخدم أدوات التحكم عن بعد غير المصرح بها في العمل.',
      'تحفظ قائمة بالمنصات المعتمدة.',
      'الموظفون على علم بقائمة المنصات المعتمدة.',
      'تثبيت الأدوات غير المعتمدة أو استخدامها على أجهزة الجهة مقيد بالإعدادات متى أمكن.'
    ],
    evidence: [
      'Approved collaboration platform list published to staff',
      'Application allow list or blocklist configuration from endpoint management',
      'Awareness communication announcing the list',
      'Exception records for any tolerated third party tool'
    ],
    evidenceAr: [
      'قائمة منصات التعاون المعتمدة المعممة على الموظفين',
      'إعداد قائمة السماح أو الحجب للتطبيقات من نظام إدارة الأجهزة الطرفية',
      'تعميم توعوي يعلن القائمة',
      'سجلات الاستثناء لأي أداة طرف ثالث مسموح بها'
    ],
    cadence: 'continuous',
    effort: 'low',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['PR.PS-01', 'GV.PO-01'], cis: ['2.3', '2.5', '2.7'] }
  },
  {
    id: 'PR-4.2',
    fn: 'PR',
    title: 'Portable Media Device Control',
    titleAr: 'التحكم في وسائط التخزين الخارجية',
    purpose: 'Limit the risks from use of unapproved removable media devices.',
    purposeAr: 'الحد من مخاطر استخدام وسائط التخزين القابلة للإزالة غير المعتمدة.',
    purposeSource: 'annex',
    requirement:
      'Where feasible, restrict or technically disable the use of unapproved portable storage media (e.g., USB drives) on Entity systems, especially those handling Sensitive data. Establish procedures to allow only authorized portable media if necessary for business, and train staff on proper usage of portable media devices.',
        requirementAr:
      'تقيد الجهة متى أمكن استخدام وسائط التخزين الخارجية غير المعتمدة كأقراص الناقل التسلسلي العام على أنظمتها أو تعطله تقنيا، ولا سيما الأنظمة التي تعالج بيانات حساسة، وتضع إجراءات لا تسمح إلا بوسائط التخزين الخارجية المصرح بها إذا اقتضت حاجة العمل ذلك، وتدرب الموظفين على الاستخدام السليم لأجهزة وسائط التخزين الخارجية.',
checks: [
      'Use of unapproved portable storage media is restricted or technically disabled where feasible.',
      'Systems handling Sensitive data receive the strictest portable media restriction.',
      'A procedure exists to authorize portable media where a business need exists.',
      'Only authorized portable media can be used.',
      'Staff are trained on proper usage of portable media devices.'
    ],
    checksAr: [
      'استخدام وسائط التخزين الخارجية غير المعتمدة مقيد أو معطل تقنيا متى أمكن.',
      'تخضع الأنظمة التي تعالج بيانات حساسة لأشد قيود وسائط التخزين الخارجية.',
      'يوجد إجراء لاعتماد وسائط التخزين الخارجية عند وجود حاجة عمل.',
      'وسائط التخزين الخارجية المصرح بها وحدها يمكن استخدامها.',
      'الموظفون مدربون على الاستخدام السليم لأجهزة وسائط التخزين الخارجية.'
    ],
    evidence: [
      'Endpoint policy showing removable media control settings',
      'Register of authorized media and their approvals',
      'Training module covering removable media',
      'Report of blocked device events'
    ],
    evidenceAr: [
      'سياسة الأجهزة الطرفية تبين إعدادات التحكم في الوسائط القابلة للإزالة',
      'سجل وسائط التخزين المصرح بها واعتماداتها',
      'وحدة تدريبية تغطي الوسائط القابلة للإزالة',
      'تقرير أحداث الأجهزة المحجوبة'
    ],
    cadence: 'continuous',
    effort: 'low',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['PR.DS-01', 'PR.PS-01'], cis: ['10.3', '10.4', '3.9'] }
  },
  {
    id: 'PR-5',
    fn: 'PR',
    title: 'Data Protection, Backup & Lifecycle',
    titleAr: 'حماية البيانات والنسخ الاحتياطي ودورة حياتها',
    purpose:
      'Ensure critical data is appropriately protected, can be restored, and is disposed of safely.',
    purposeAr:
      'ضمان حماية البيانات الحرجة على النحو المناسب وإمكانية استعادتها والتخلص منها بأمان.',
    purposeSource: 'annex',
    requirement:
      'Implement regular, automated backups for critical systems and data, with priority to Sensitive and Restricted data. Store backups in at least one separate location (for example, a separate network segment, storage system, or cloud account). Protect backup data from unauthorized access and tampering (e.g., access controls, encryption). Test restoration of backups for key systems at least annually. Define and apply retention periods and secure disposal procedures aligned with legal requirements and the National Data Classification Framework, ensuring Sensitive data is securely erased or destroyed when no longer needed. For Sensitive data, if backups involve storage outside Kuwait (such as cloud backups), obtain any required approvals in line with data sovereignty requirements.',
        requirementAr:
      'تنفذ الجهة نسخا احتياطية آلية منتظمة للأنظمة والبيانات الحرجة مع إعطاء الأولوية للبيانات الحساسة والمقيدة، وتحفظ النسخ في موقع منفصل واحد على الأقل كمقطع شبكي مستقل أو نظام تخزين آخر أو حساب سحابي، وتحمي بيانات النسخ الاحتياطي من الوصول غير المصرح به ومن العبث بضوابط الوصول والتشفير، وتختبر استعادة النسخ للأنظمة الرئيسية سنويا على الأقل، وتحدد وتطبق مدد الحفظ وإجراءات الإتلاف الآمن بما يتوافق مع المتطلبات القانونية ومع الإطار الوطني لتصنيف البيانات وبما يضمن محو البيانات الحساسة أو إتلافها بصورة آمنة عند انتفاء الحاجة إليها، أما البيانات الحساسة فإذا انطوت نسخها الاحتياطية على حفظ خارج الكويت كالنسخ السحابية وجب الحصول على أي موافقات مطلوبة وفق متطلبات سيادة البيانات.',
checks: [
      'Regular automated backups run for critical systems and data.',
      'Sensitive and Restricted data receive backup priority.',
      'Backups are stored in at least one separate location.',
      'Backup data is protected from unauthorized access.',
      'Backup data is protected from tampering.',
      'Restoration of backups for key systems is tested at least annually.',
      'Retention periods are defined and applied.',
      'Secure disposal procedures are defined and applied.',
      'Retention and disposal align with legal requirements and the National Data Classification Framework.',
      'Sensitive data is securely erased or destroyed when no longer needed.',
      'Backups of Sensitive data held outside Kuwait carry the required approvals.'
    ],
    checksAr: [
      'تجرى نسخ احتياطية آلية منتظمة للأنظمة والبيانات الحرجة.',
      'تعطى البيانات الحساسة والمقيدة أولوية في النسخ الاحتياطي.',
      'تحفظ النسخ الاحتياطية في موقع منفصل واحد على الأقل.',
      'بيانات النسخ الاحتياطي محمية من الوصول غير المصرح به.',
      'بيانات النسخ الاحتياطي محمية من العبث.',
      'تختبر استعادة النسخ الاحتياطية للأنظمة الرئيسية سنويا على الأقل.',
      'مدد الحفظ محددة ومطبقة.',
      'إجراءات الإتلاف الآمن محددة ومطبقة.',
      'الحفظ والإتلاف متوائمان مع المتطلبات القانونية ومع الإطار الوطني لتصنيف البيانات.',
      'البيانات الحساسة تمحى أو تتلف بصورة آمنة عند انتفاء الحاجة إليها.',
      'النسخ الاحتياطية للبيانات الحساسة المحفوظة خارج الكويت تحمل الموافقات المطلوبة.'
    ],
    evidence: [
      'Backup schedule and last thirty days of job success reports',
      'Architecture note showing the separate backup location',
      'Backup encryption and access control configuration',
      'Restore test report with date, scope and outcome',
      'Retention schedule and destruction certificates'
    ],
    evidenceAr: [
      'جدول النسخ الاحتياطي وتقارير نجاح المهام لآخر ثلاثين يوما',
      'مذكرة معمارية تبين موقع النسخ الاحتياطي المنفصل',
      'إعداد تشفير النسخ الاحتياطية وضوابط الوصول إليها',
      'تقرير اختبار الاستعادة مع التاريخ والنطاق والنتيجة',
      'جدول الحفظ وشهادات الإتلاف'
    ],
    cadence: 'annual',
    effort: 'high',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['PR.DS-11', 'PR.DS-01', 'PR.DS-10'], cis: ['11.1', '11.2', '11.3', '11.4', '11.5', '3.5'] }
  },
  {
    id: 'PR-6',
    fn: 'PR',
    title: 'Physical Protection of Critical IT Assets',
    titleAr: 'الحماية المادية للأصول التقنية الحرجة',
    purpose: 'Reduce the risk of tampering, theft or damage to critical IT equipment.',
    purposeAr: 'تقليل مخاطر العبث بالمعدات التقنية الحرجة أو سرقتها أو إتلافها.',
    purposeSource: 'annex',
    requirement:
      'Identify critical IT areas (for example, data centers, server rooms, main network rooms, and locations where backup media are stored) and keep a simple list of them. For these areas, implement basic physical protections appropriate to the site, including at least:\n' +
      '• Doors or cabinets that can be locked when the area is unattended.\n' +
      '• Restricted access so that only authorized personnel can enter or unlock equipment (for example, keys, access cards, or codes managed by IT or facilities).\n' +
      '• A simple record of non-routine visitors (such as contractors or vendors) to critical IT areas, which MAY be kept using existing building or guard logs.\n' +
      'Store backup media and portable equipment (such as laptops) in a locked room or cabinet when not in use; avoid leaving them unattended in public or shared areas. This control focuses on the physical protection of IT assets and SHOULD make use of the entity’s existing building or facility security arrangements wherever possible.',
        requirementAr:
      'تحدد الجهة المناطق التقنية الحرجة كمراكز البيانات وغرف الخوادم وغرف الشبكة الرئيسية ومواقع حفظ وسائط النسخ الاحتياطي وتحفظ قائمة مبسطة بها، وتطبق على هذه المناطق حمايات مادية أساسية تناسب الموقع تشمل كحد أدنى ما يلي:\n' +
      '• أبوابا أو خزائن يمكن قفلها عند خلو المنطقة.\n' +
      '• وصولا مقيدا بحيث لا يدخل أو يفتح المعدات إلا المخولون، وذلك مثلا بمفاتيح أو بطاقات دخول أو رموز تديرها تقنية المعلومات أو إدارة المرافق.\n' +
      '• سجلا مبسطا للزوار غير المعتادين كالمقاولين والموردين إلى المناطق التقنية الحرجة، ويجوز حفظه ضمن سجلات المبنى أو الحراسة القائمة.\n' +
      'وتحفظ وسائط النسخ الاحتياطي والمعدات المحمولة كالحواسيب المحمولة في غرفة أو خزانة مقفلة عند عدم الاستخدام، مع تجنب تركها دون رقابة في الأماكن العامة أو المشتركة، ويركز هذا الضابط على الحماية المادية للأصول التقنية وينبغي أن يستفيد من ترتيبات أمن المبنى أو المرافق القائمة لدى الجهة حيثما أمكن.',
checks: [
      'Critical IT areas are identified and listed.',
      'Doors or cabinets in critical IT areas can be locked when unattended.',
      'Access is restricted so only authorized personnel can enter or unlock equipment.',
      'Keys, access cards or codes are managed by IT or facilities.',
      'A record of non routine visitors to critical IT areas is kept.',
      'Backup media are stored in a locked room or cabinet when not in use.',
      'Portable equipment is stored in a locked room or cabinet when not in use.',
      'Equipment is not left unattended in public or shared areas.'
    ],
    checksAr: [
      'المناطق التقنية الحرجة محددة ومدرجة في قائمة.',
      'الأبواب أو الخزائن في المناطق التقنية الحرجة يمكن قفلها عند خلوها.',
      'الوصول مقيد بحيث لا يدخل أو يفتح المعدات إلا المخولون.',
      'تدار المفاتيح وبطاقات الدخول والرموز من تقنية المعلومات أو إدارة المرافق.',
      'يحفظ سجل بالزوار غير المعتادين للمناطق التقنية الحرجة.',
      'تحفظ وسائط النسخ الاحتياطي في غرفة أو خزانة مقفلة عند عدم الاستخدام.',
      'تحفظ المعدات المحمولة في غرفة أو خزانة مقفلة عند عدم الاستخدام.',
      'لا تترك المعدات دون رقابة في الأماكن العامة أو المشتركة.'
    ],
    evidence: [
      'List of critical IT areas',
      'Access card holder list for each area with authorization basis',
      'Visitor log samples covering contractor and vendor entry',
      'Photographs or inspection notes of media storage arrangements'
    ],
    evidenceAr: [
      'قائمة المناطق التقنية الحرجة',
      'قائمة حاملي بطاقات الدخول لكل منطقة مع أساس التخويل',
      'عينات من سجل الزوار تغطي دخول المقاولين والموردين',
      'صور أو ملاحظات تفتيش لترتيبات حفظ الوسائط'
    ],
    cadence: 'annual',
    effort: 'low',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['PR.AA-06', 'ID.AM-01'], cis: ['1.1', '12.1'] }
  }
];
