// DETECT (DE), RESPOND (RS) and RECOVER (RC) controls of the Kuwait NBCC baseline.

export const DETECT = [
  {
    id: 'DE-1',
    fn: 'DE',
    title: 'Audit Logging and Monitoring',
    titleAr: 'تسجيل الأحداث والمراقبة',
    purpose: 'Provide visibility into suspicious activity and support investigations.',
    purposeAr: 'إتاحة رؤية للأنشطة المشبوهة ودعم التحقيقات.',
    requirement:
      'Enable audit logging on critical systems, network devices, security tools, and key applications. At minimum, log authentication events, administrative actions, and important security events. Where feasible, centralize logs into a basic logging solution for easier review. Restrict access to logs to authorized personnel only and protect logs from unauthorized modification or deletion (including logging configuration changes), prioritizing Critical Systems and the central logging solution where used. Retain logs for at least 90 days live and 12 months in total (live or archived). Review logs for suspicious activity at a frequency appropriate to the Entity\u2019s risk (for example, weekly for smaller Entities, daily for higher-risk environments).',
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
    evidence: [
      'Logging configuration export from a sample of critical systems',
      'Central log platform onboarding list against the asset inventory',
      'Retention policy configuration proving 90 day live and 12 month total',
      'Log review records with reviewer, date and findings'
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
    requirement:
      'Ensure all information systems (servers, workstations, network devices) synchronize their system clocks to a reliable, authoritative time source (e.g., NTP). Timestamps in logs MUST be consistent across the infrastructure. Periodically verify that system clocks remain in sync (for example, by comparing log timestamps from different systems).',
    checks: [
      'Servers synchronize their clocks to a reliable authoritative time source.',
      'Workstations synchronize their clocks to a reliable authoritative time source.',
      'Network devices synchronize their clocks to a reliable authoritative time source.',
      'Log timestamps are consistent across the infrastructure.',
      'System clock synchronization is verified periodically.'
    ],
    evidence: [
      'NTP configuration standard and the authoritative source in use',
      'Time drift report or comparison of timestamps across systems',
      'Group policy or configuration management proof of enforcement'
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
    title: 'Incident Reporting to NCSC and Leadership',
    titleAr: 'الإبلاغ عن الحوادث للمركز والقيادة',
    purpose: 'Ensure serious incidents are reported to NCSC and handled by designated leaders.',
    purposeAr: 'ضمان الإبلاغ عن الحوادث الجسيمة للمركز ومعالجتها من قبل قيادات محددة.',
    requirement:
      'Establish and communicate a simple incident reporting process so that staff know how to report suspected incidents (for example, phishing, data loss, or system compromise). Appoint one person as the incident response lead and at least one backup to coordinate incident handling, even if external service providers are used. Maintain up-to-date contact details for the incident lead, backup, relevant service providers, and NCSC. Where an actual or suspected cybersecurity incident or threat may be reportable under NCSC-issued incident management or reporting guidance, the Entity MUST notify NCSC promptly through the official channels and within the applicable timelines set by NCSC. Where appropriate, the Entity MUST use out-of-band communication channels during active incidents or where normal channels may be affected. The Entity MUST provide follow-up updates and information as required by applicable NCSC reporting guidance.',
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
    evidence: [
      'Published incident reporting procedure and the channel staff use',
      'Appointment record for the incident lead and backup',
      'Contact directory including NCSC official channels',
      'Notification records for any incident in the reporting period',
      'Out of band channel description and test record'
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
    title: 'Basic Incident Handling and Coordination',
    titleAr: 'المعالجة الأساسية للحوادث والتنسيق بشأنها',
    purpose: 'Provide a structured but simple way to handle incidents and cooperate with NCSC.',
    purposeAr: 'توفير أسلوب منظم وبسيط لمعالجة الحوادث والتعاون مع المركز.',
    requirement:
      'Maintain a short written incident response procedure that covers: initial triage, containment, communication, evidence preservation, recovery, and reporting/escalation (including when and how to notify NCSC and other regulators or law enforcement). When NCSC or another competent authority notifies the entity of a potential incident, promptly triage and investigate, take reasonable remedial actions, and provide feedback where requested. After significant incidents, perform a brief lessons-learned review and record key improvements to be implemented, and share relevant lessons learned with NCSC or sector authorities where appropriate.',
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
    evidence: [
      'Incident response procedure covering the six required stages',
      'Ticket history showing triage of authority notifications',
      'Lessons learned reports for significant incidents',
      'Improvement tracker linked to incident findings'
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
    requirement:
      'Maintain a simple recovery plan or documented procedures for restoring critical systems and services after incidents or other disruptions. The plan SHOULD reference backup locations, key contacts, and any sequencing needed for restoration, especially for Sensitive and Restricted data. Review and update the plan at least annually and after major changes.',
    checks: [
      'A recovery plan or documented restoration procedures exist for critical systems and services.',
      'The plan references backup locations.',
      'The plan references key contacts.',
      'The plan sets out any sequencing needed for restoration.',
      'Sequencing gives particular attention to Sensitive and Restricted data.',
      'The plan is reviewed and updated at least annually.',
      'The plan is reviewed and updated after major changes.'
    ],
    evidence: [
      'Recovery plan document with version and review date',
      'Restoration runbook per critical system',
      'Contact list embedded in or attached to the plan',
      'Change record showing update after a major change'
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
    title: 'Testing and Continuous Improvement',
    titleAr: 'الاختبار والتحسين المستمر',
    purpose: 'Ensure recovery works in practice and improvements are implemented.',
    purposeAr: 'التأكد من نجاعة التعافي عمليا وتنفيذ التحسينات.',
    requirement:
      'Conduct basic recovery or continuity tests (for example, tabletop exercises or partial restoration tests) for critical systems at least annually. After tests or real incidents, capture lessons learned, update procedures and controls where practical, and track completion of agreed improvements.',
    checks: [
      'Recovery or continuity tests are conducted for critical systems at least annually.',
      'Tests take a recognizable form such as a tabletop exercise or partial restoration test.',
      'Lessons learned are captured after tests.',
      'Lessons learned are captured after real incidents.',
      'Procedures and controls are updated where practical.',
      'Completion of agreed improvements is tracked.'
    ],
    evidence: [
      'Test plan and after action report for the current year',
      'Attendance record for the exercise',
      'Updated procedure versions traceable to test findings',
      'Improvement tracker with closure dates'
    ],
    cadence: 'annual',
    effort: 'medium',
    phase: 3,
    appliesWhen: [],
    crosswalk: { csf: ['ID.IM-02', 'RC.RP-05'], cis: ['11.5', '17.7'] }
  }
];
