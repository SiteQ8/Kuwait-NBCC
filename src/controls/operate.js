// DETECT (DE), RESPOND (RS) and RECOVER (RC) controls of the Kuwait NBCC baseline.

export const DETECT = [
  {
    id: 'DE-1',
    fn: 'DE',
    title: 'Audit Logging & Monitoring',
    titleAr: 'تسجيل الأحداث والمراقبة',
    purpose: 'Provide visibility into suspicious activity and support investigations.',
    purposeAr: 'إتاحة رؤية للأنشطة المشبوهة ودعم التحقيقات.',
    purposeSource: 'annex',
    requirement:
      'Enable audit logging on critical systems, network devices, security tools, and key applications. At minimum, log authentication events, administrative actions, and important security events. Where feasible, centralize logs into a basic logging solution for easier review.\n' +
      '• Restrict access to logs to authorized personnel only and protect logs from unauthorized modification or deletion (including logging configuration changes), prioritizing Critical Systems and the central logging solution where used.\n' +
      '• Retain logs for at least 90 days live and 12 months in total (live or archived). Review logs for suspicious activity at a frequency appropriate to the Entity’s risk (for example, weekly for smaller Entities, daily for higher-risk environments).',
        requirementAr:
      'تفعل الجهة تسجيل التدقيق على الأنظمة الحرجة وأجهزة الشبكة وأدوات الأمن والتطبيقات الرئيسية، وتسجل كحد أدنى أحداث المصادقة والإجراءات الإدارية والأحداث الأمنية المهمة، وتجمع السجلات مركزيا في نظام تسجيل مركزي متى كان ذلك ممكنا تيسيرا للمراجعة.\n' +
      '• ويقصر الوصول إلى السجلات على المخولين وحدهم، وتحمى السجلات من التعديل أو الحذف غير المصرح به بما في ذلك تغييرات إعدادات التسجيل، مع إعطاء الأولوية للأنظمة الحرجة ولحل التسجيل المركزي حيثما استخدم.\n' +
      '• وتحفظ السجلات تسعين يوما على الأقل بصورة حية واثني عشر شهرا إجمالا حية كانت أو مؤرشفة، وتراجع بحثا عن نشاط مشبوه بوتيرة تناسب مخاطر الجهة، فأسبوعيا مثلا للجهات الأصغر ويوميا للبيئات الأعلى خطورة.',
checks: [
      'Audit logging is enabled on critical systems.',
      'Audit logging is enabled on network devices.',
      'Audit logging is enabled on security tools.',
      'Audit logging is enabled on key applications.',
      'Authentication events are logged.',
      'Administrative actions are logged.',
      'Important security events are logged.',
      'Logs are centralized into a logging solution where feasible.',
      'Access to logs is restricted to authorized personnel only.',
      'Logs are protected from unauthorized modification or deletion.',
      'Changes to logging configuration are themselves logged.',
      'Logs are retained at least 90 days live.',
      'Logs are retained at least 12 months in total, live or archived.',
      'Logs are reviewed for suspicious activity at a frequency matched to entity risk.'
    ],
    checksAr: [
      'تسجيل التدقيق مفعل على الأنظمة الحرجة.',
      'تسجيل التدقيق مفعل على أجهزة الشبكة.',
      'تسجيل التدقيق مفعل على أدوات الأمن.',
      'تسجيل التدقيق مفعل على التطبيقات الرئيسية.',
      'أحداث المصادقة مسجلة.',
      'الإجراءات الإدارية مسجلة.',
      'الأحداث الأمنية المهمة مسجلة.',
      'تجمع السجلات مركزيا في نظام تسجيل مركزي متى أمكن.',
      'الوصول إلى السجلات مقصور على المخولين فقط.',
      'السجلات محمية من التعديل أو الحذف غير المصرح به.',
      'تسجل التغييرات على إعدادات التسجيل هي نفسها.',
      'تحفظ السجلات تسعين يوما على الأقل بصورة حية.',
      'تحفظ السجلات اثني عشر شهرا على الأقل إجمالا حية كانت أو مؤرشفة.',
      'تراجع السجلات بحثا عن نشاط مشبوه بوتيرة تناسب مخاطر الجهة.'
    ],
    evidence: [
      'Logging configuration export from a sample of critical systems',
      'Central log platform onboarding list against the asset inventory',
      'Retention policy configuration proving 90 day live and 12 month total',
      'Log review records with reviewer, date and findings'
    ],
    evidenceAr: [
      'تصدير إعدادات التسجيل من عينة من الأنظمة الحرجة',
      'قائمة الأنظمة المرتبطة بمنصة السجلات المركزية مقارنة بحصر الأصول',
      'إعداد سياسة الحفظ يثبت تسعين يوما حية واثني عشر شهرا إجمالا',
      'محاضر مراجعة السجلات مع اسم المراجع والتاريخ والنتائج'
    ],
    cadence: 'weekly',
    effort: 'high',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['DE.CM-01', 'DE.CM-03', 'PR.PS-04'], cis: ['8.1', '8.2', '8.5', '8.9', '8.10', '8.11'] }
  },
  {
    id: 'DE-2',
    fn: 'DE',
    title: 'Time Synchronization',
    titleAr: 'مزامنة الوقت',
    purpose: 'Ensure consistent timestamps across systems to facilitate incident investigation.',
    purposeAr: 'ضمان اتساق الطوابع الزمنية بين الأنظمة لتيسير التحقيق في الحوادث.',
    purposeSource: 'annex',
    requirement:
      'Ensure all information systems (servers, workstations, network devices) synchronize their system clocks to a reliable, authoritative time source (e.g., NTP). Timestamps in logs MUST be consistent across the infrastructure. Periodically verify that system clocks remain in sync (for example, by comparing log timestamps from different systems).',
        requirementAr:
      'تضمن الجهة أن تزامن جميع أنظمة المعلومات، من خوادم ومحطات عمل وأجهزة شبكة، ساعاتها مع مصدر زمني موثوق ومعتمد مثل بروتوكول توقيت الشبكة، ويجب أن تكون الطوابع الزمنية في السجلات متسقة عبر البنية التحتية، مع التحقق دوريا من بقاء ساعات الأنظمة متزامنة وذلك مثلا بمقارنة الطوابع الزمنية الواردة من أنظمة مختلفة.',
checks: [
      'Servers synchronize their clocks to a reliable authoritative time source.',
      'Workstations synchronize their clocks to a reliable authoritative time source.',
      'Network devices synchronize their clocks to a reliable authoritative time source.',
      'Log timestamps are consistent across the infrastructure.',
      'System clock synchronization is verified periodically.'
    ],
    checksAr: [
      'تزامن الخوادم ساعاتها مع مصدر زمني موثوق ومعتمد.',
      'تزامن محطات العمل ساعاتها مع مصدر زمني موثوق ومعتمد.',
      'تزامن أجهزة الشبكة ساعاتها مع مصدر زمني موثوق ومعتمد.',
      'الطوابع الزمنية في السجلات متسقة عبر البنية التحتية.',
      'تزامن ساعات الأنظمة يتحقق منه دوريا.'
    ],
    evidence: [
      'NTP configuration standard and the authoritative source in use',
      'Time drift report or comparison of timestamps across systems',
      'Group policy or configuration management proof of enforcement'
    ],
    evidenceAr: [
      'معيار إعداد بروتوكول توقيت الشبكة والمصدر المعتمد المستخدم',
      'تقرير انحراف التوقيت أو مقارنة الطوابع الزمنية عبر الأنظمة',
      'ما يثبت الإلزام عبر سياسة المجموعة أو إدارة الإعدادات'
    ],
    cadence: 'quarterly',
    effort: 'low',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['DE.CM-01', 'PR.PS-01'], cis: ['8.4'] }
  }
];

export const RESPOND = [
  {
    id: 'RS-1',
    fn: 'RS',
    title: 'Incident Reporting to NCSC & Leadership',
    titleAr: 'الإبلاغ عن الحوادث للمركز وللإدارة العليا',
    purpose: 'Ensure serious incidents are reported to NCSC and handled by designated leaders.',
    purposeAr: 'ضمان الإبلاغ عن الحوادث الجسيمة للمركز ومعالجتها من قبل قيادات محددة.',
    purposeSource: 'annex',
    requirement:
      'Establish and communicate a simple incident reporting process so that staff know how to report suspected incidents (for example, phishing, data loss, or system compromise). Appoint one person as the incident response lead and at least one backup to coordinate incident handling, even if external service providers are used. Maintain up-to-date contact details for the incident lead, backup, relevant service providers, and NCSC. Where an actual or suspected cybersecurity incident or threat may be reportable under NCSC-issued incident management or reporting guidance, the Entity MUST notify NCSC promptly through the official channels and within the applicable timelines set by NCSC. Where appropriate, the Entity MUST use out-of-band communication channels during active incidents or where normal channels may be affected. The Entity MUST provide follow-up updates and information as required by applicable NCSC reporting guidance.',
        requirementAr:
      'تنشئ الجهة آلية مبسطة للإبلاغ عن الحوادث وتعممها بحيث يعرف الموظفون كيف يبلغون عن الحوادث المشتبه بها، ومنها مثلا التصيد أو فقد البيانات أو اختراق الأنظمة، وتعين شخصا واحدا مسؤولا عن الاستجابة للحوادث وبديلا واحدا على الأقل لتنسيق التعامل معها حتى مع الاستعانة بمزودي خدمة خارجيين، وتحفظ بيانات اتصال محدثة للمسؤول وبديله ولمزودي الخدمة المعنيين وللمركز، وحيثما كان الحادث أو التهديد السيبراني القائم أو المشتبه به مما يجب الإبلاغ عنه بموجب إرشادات المركز في إدارة الحوادث أو الإبلاغ عنها، وجب على الجهة إخطار المركز فورا عبر القنوات الرسمية وضمن المهل التي يحددها، وعند الاقتضاء يجب على الجهة استخدام قنوات اتصال بديلة أثناء الحوادث النشطة أو حين تتأثر القنوات المعتادة، كما يجب عليها تقديم التحديثات والمعلومات اللاحقة وفق إرشادات الإبلاغ المعمول بها لدى المركز.',
checks: [
      'A simple incident reporting process is established.',
      'The reporting process is communicated so staff know how to report suspected incidents.',
      'One person is appointed as incident response lead.',
      'At least one backup to the incident response lead is appointed.',
      'The appointment holds even where external service providers are used.',
      'Contact details are current for the incident lead and backup.',
      'Contact details are current for relevant service providers.',
      'Contact details are current for NCSC.',
      'Reportable incidents are notified to NCSC promptly through official channels.',
      'Notification meets the applicable timelines set by NCSC.',
      'Out of band communication channels are available for use during active incidents.',
      'Follow up updates are provided to NCSC as required by reporting guidance.'
    ],
    checksAr: [
      'توجد آلية مبسطة للإبلاغ عن الحوادث.',
      'آلية الإبلاغ معممة بحيث يعرف الموظفون كيف يبلغون عن الحوادث المشتبه بها.',
      'يعين شخص واحد مسؤولا عن الاستجابة للحوادث.',
      'يعين بديل واحد على الأقل لمسؤول الاستجابة للحوادث.',
      'التعيين قائم حتى مع الاستعانة بمزودي خدمة خارجيين.',
      'بيانات الاتصال محدثة لمسؤول الحوادث وبديله.',
      'بيانات الاتصال محدثة لمزودي الخدمة المعنيين.',
      'بيانات الاتصال محدثة للمركز.',
      'الحوادث الواجب الإبلاغ عنها تبلغ للمركز فورا عبر القنوات الرسمية.',
      'الإبلاغ يلتزم بالمهل التي يحددها المركز.',
      'تتوافر قنوات اتصال بديلة للاستخدام أثناء الحوادث النشطة.',
      'تقدم التحديثات اللاحقة للمركز وفق إرشادات الإبلاغ.'
    ],
    evidence: [
      'Published incident reporting procedure and the channel staff use',
      'Appointment record for the incident lead and backup',
      'Contact directory including NCSC official channels',
      'Notification records for any incident in the reporting period',
      'Out of band channel description and test record'
    ],
    evidenceAr: [
      'إجراء الإبلاغ عن الحوادث المعمم والقناة التي يستخدمها الموظفون',
      'محضر تعيين مسؤول الحوادث وبديله',
      'دليل جهات الاتصال شاملا القنوات الرسمية للمركز',
      'سجلات الإبلاغ عن أي حادث خلال فترة التقرير',
      'وصف القناة البديلة ومحضر اختبارها'
    ],
    cadence: 'continuous',
    effort: 'medium',
    phase: 1,
    appliesWhen: [],
    crosswalk: { csf: ['RS.CO-02', 'RS.CO-03', 'RS.MA-01'], cis: ['17.1', '17.2', '17.3', '17.5'] }
  },
  {
    id: 'RS-2',
    fn: 'RS',
    title: 'Basic Incident Handling & Coordination',
    titleAr: 'التعامل الأساسي مع الحوادث والتنسيق بشأنها',
    purpose: 'Provide a structured but simple way to handle incidents and cooperate with NCSC.',
    purposeAr: 'توفير أسلوب منظم وبسيط لمعالجة الحوادث والتعاون مع المركز.',
    purposeSource: 'annex',
    requirement:
      'Maintain a short written incident response procedure that covers: initial triage, containment, communication, evidence preservation, recovery, and reporting/escalation (including when and how to notify NCSC and other regulators or law enforcement). When NCSC or another competent authority notifies the entity of a potential incident, promptly triage and investigate, take reasonable remedial actions, and provide feedback where requested. After significant incidents, perform a brief lessons-learned review and record key improvements to be implemented, and share relevant lessons learned with NCSC or sector authorities where appropriate.',
        requirementAr:
      'تحفظ الجهة إجراء مكتوبا موجزا للاستجابة للحوادث يغطي الفرز الأولي والاحتواء والتواصل وحفظ الأدلة والتعافي والإبلاغ والتصعيد بما في ذلك متى وكيف يخطر المركز وسائر الجهات الرقابية أو جهات إنفاذ القانون، وحين يخطر المركز أو جهة مختصة أخرى الجهة بحادث محتمل، تفرزه وتحقق فيه فورا وتتخذ إجراءات معالجة معقولة وتقدم تغذية راجعة عند طلبها، وبعد الحوادث الجوهرية تجري مراجعة موجزة للدروس المستفادة وتسجل التحسينات الرئيسية الواجب تنفيذها وتشارك الدروس ذات الصلة مع المركز أو جهات القطاع عند الاقتضاء.',
checks: [
      'A written incident response procedure exists.',
      'The procedure covers initial triage.',
      'The procedure covers containment.',
      'The procedure covers communication.',
      'The procedure covers evidence preservation.',
      'The procedure covers recovery.',
      'The procedure covers reporting and escalation including NCSC, regulators and law enforcement.',
      'Notifications from NCSC or another competent authority are triaged and investigated promptly.',
      'Reasonable remedial actions are taken in response to such notifications.',
      'Feedback is provided to the notifying authority where requested.',
      'A lessons learned review follows every significant incident.',
      'Key improvements from lessons learned are recorded.',
      'Relevant lessons learned are shared with NCSC or sector authorities where appropriate.'
    ],
    checksAr: [
      'يوجد إجراء مكتوب للاستجابة للحوادث.',
      'يغطي الإجراء الفرز الأولي.',
      'يغطي الإجراء الاحتواء.',
      'يغطي الإجراء التواصل.',
      'يغطي الإجراء حفظ الأدلة.',
      'يغطي الإجراء التعافي.',
      'يغطي الإجراء الإبلاغ والتصعيد شاملا المركز والجهات الرقابية وجهات إنفاذ القانون.',
      'الإخطارات الواردة من المركز أو من جهة مختصة أخرى تفرز ويحقق فيها فورا.',
      'تتخذ إجراءات معالجة معقولة استجابة لتلك الإخطارات.',
      'تقدم تغذية راجعة للجهة المخطرة عند طلبها.',
      'تجرى مراجعة للدروس المستفادة عقب كل حادث جوهري.',
      'التحسينات الرئيسية المستخلصة من الدروس المستفادة مسجلة.',
      'تشارك الدروس المستفادة ذات الصلة مع المركز أو جهات القطاع عند الاقتضاء.'
    ],
    evidence: [
      'Incident response procedure covering the six required stages',
      'Ticket history showing triage of authority notifications',
      'Lessons learned reports for significant incidents',
      'Improvement tracker linked to incident findings'
    ],
    evidenceAr: [
      'إجراء الاستجابة للحوادث يغطي المراحل الست المطلوبة',
      'سجل التذاكر يبين فرز إخطارات الجهات المختصة',
      'تقارير الدروس المستفادة للحوادث الجوهرية',
      'سجل متابعة التحسينات مرتبطا بنتائج الحوادث'
    ],
    cadence: 'per incident',
    effort: 'medium',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['RS.MA-02', 'RS.MI-01', 'RS.AN-03', 'ID.IM-04'], cis: ['17.4', '17.6', '17.8'] }
  }
];

export const RECOVER = [
  {
    id: 'RC-1',
    fn: 'RC',
    title: 'Recovery Planning',
    titleAr: 'التخطيط للتعافي',
    purpose: 'Support structured recovery after incidents and disruptions.',
    purposeAr: 'دعم التعافي المنظم بعد الحوادث والاضطرابات.',
    purposeSource: 'annex',
    requirement:
      'Maintain a simple recovery plan or documented procedures for restoring critical systems and services after incidents or other disruptions. The plan SHOULD reference backup locations, key contacts, and any sequencing needed for restoration, especially for Sensitive and Restricted data. Review and update the plan at least annually and after major changes.',
        requirementAr:
      'تحفظ الجهة خطة تعاف مبسطة أو إجراءات موثقة لاستعادة الأنظمة والخدمات الحرجة بعد الحوادث أو غيرها من حالات التعطل، وينبغي أن تشير الخطة إلى مواقع النسخ الاحتياطية وجهات الاتصال الرئيسية وأي ترتيب لازم لعمليات الاستعادة ولا سيما بالنسبة للبيانات الحساسة والمقيدة، وتراجع الخطة وتحدث سنويا على الأقل وبعد التغييرات الجوهرية.',
checks: [
      'A recovery plan or documented restoration procedures exist for critical systems and services.',
      'The plan references backup locations.',
      'The plan references key contacts.',
      'The plan sets out any sequencing needed for restoration.',
      'Sequencing gives particular attention to Sensitive and Restricted data.',
      'The plan is reviewed and updated at least annually.',
      'The plan is reviewed and updated after major changes.'
    ],
    checksAr: [
      'توجد خطة تعاف أو إجراءات استعادة موثقة للأنظمة والخدمات الحرجة.',
      'الخطة تشير إلى مواقع النسخ الاحتياطية.',
      'الخطة تشير إلى جهات الاتصال الرئيسية.',
      'تبين الخطة أي ترتيب لازم لعمليات الاستعادة.',
      'الترتيب يولي عناية خاصة للبيانات الحساسة والمقيدة.',
      'تراجع الخطة وتحدث سنويا على الأقل.',
      'تراجع الخطة وتحدث عقب التغييرات الجوهرية.'
    ],
    evidence: [
      'Recovery plan document with version and review date',
      'Restoration runbook per critical system',
      'Contact list embedded in or attached to the plan',
      'Change record showing update after a major change'
    ],
    evidenceAr: [
      'وثيقة خطة التعافي مع رقم الإصدار وتاريخ المراجعة',
      'دليل تشغيل الاستعادة لكل نظام حرج',
      'قائمة جهات الاتصال مدرجة في الخطة أو مرفقة بها',
      'محضر تغيير يبين التحديث عقب تغيير جوهري'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 2,
    appliesWhen: [],
    crosswalk: { csf: ['RC.RP-01', 'RC.RP-03'], cis: ['11.1', '17.4'] }
  },
  {
    id: 'RC-2',
    fn: 'RC',
    title: 'Testing & Continuous Improvement',
    titleAr: 'الاختبار والتحسين المستمر',
    purpose: 'Ensure recovery works in practice and improvements are implemented.',
    purposeAr: 'التأكد من نجاعة التعافي عمليا وتنفيذ التحسينات.',
    purposeSource: 'annex',
    requirement:
      'Conduct basic recovery or continuity tests (for example, tabletop exercises or partial restoration tests) for critical systems at least annually. After tests or real incidents, capture lessons learned, update procedures and controls where practical, and track completion of agreed improvements.',
        requirementAr:
      'تجري الجهة اختبارات أساسية للتعافي أو الاستمرارية للأنظمة الحرجة سنويا على الأقل، ومنها مثلا التمارين المكتبية أو اختبارات الاستعادة الجزئية، وبعد الاختبارات أو الحوادث الفعلية توثق الدروس المستفادة وتحدث الإجراءات والضوابط حيثما كان ذلك عمليا وتتابع إنجاز التحسينات المتفق عليها.',
checks: [
      'Recovery or continuity tests are conducted for critical systems at least annually.',
      'Tests take a recognizable form such as a tabletop exercise or partial restoration test.',
      'Lessons learned are captured after tests.',
      'Lessons learned are captured after real incidents.',
      'Procedures and controls are updated where practical.',
      'Completion of agreed improvements is tracked.'
    ],
    checksAr: [
      'تجرى اختبارات التعافي أو الاستمرارية للأنظمة الحرجة سنويا على الأقل.',
      'تتخذ الاختبارات صورة معروفة كتمرين مكتبي أو اختبار استعادة جزئي.',
      'توثق الدروس المستفادة عقب الاختبارات.',
      'توثق الدروس المستفادة عقب الحوادث الفعلية.',
      'تحدث الإجراءات والضوابط حيثما كان ذلك عمليا.',
      'يتابع إنجاز التحسينات المتفق عليها.'
    ],
    evidence: [
      'Test plan and after action report for the current year',
      'Attendance record for the exercise',
      'Updated procedure versions traceable to test findings',
      'Improvement tracker with closure dates'
    ],
    evidenceAr: [
      'خطة الاختبار وتقرير ما بعد التمرين للسنة الحالية',
      'كشف حضور التمرين',
      'إصدارات الإجراءات المحدثة مرتبطة بنتائج الاختبار',
      'سجل متابعة التحسينات مع تواريخ الإغلاق'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 3,
    appliesWhen: [],
    crosswalk: { csf: ['ID.IM-02', 'RC.RP-05'], cis: ['11.5', '17.7'] }
  }
];
