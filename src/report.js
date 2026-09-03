// Renders an assessment into a self contained HTML report, markdown or CSV.

import { REGULATION, getControl, getFunction } from './catalog.js';
import { assess } from './assess.js';
import { buildPlan, deadlineStatus, evidencePack } from './plan.js';
import { evidenceRegister, unevidencedClaims } from './evidence.js';
import { mappingsFor } from './crosswalk.js';
import { BASE_CSS, TOKENS, windowScaleSVG, statusPill, scoreColor } from './theme.js';

/*
 * Some minimum requirements are bulleted in the Annex, and the bullets carry
 * meaning, so they are reproduced as a list rather than flattened into prose.
 */
function reqParas(text) {
  let html = '';
  let open = false;
  for (const para of text.split('\n')) {
    if (para.startsWith('\u2022')) {
      if (!open) { html += '<ul class="reqlist">'; open = true; }
      html += `<li>${esc(para.slice(1).trim())}</li>`;
    } else {
      if (open) { html += '</ul>'; open = false; }
      html += `<span>${esc(para)}</span>`;
    }
  }
  return open ? html + '</ul>' : html;
}

/*
 * Article 6 makes the English Annex authoritative, so an Arabic report leads
 * with the working translation and prints the official wording beneath it.
 */
function renderRequirement(control) {
  if (!isAr()) return `<b>${tr('reqL')}</b> ${reqParas(control.requirement)}`;
  return `<b>${tr('reqL')} <span class="edmark">${tr('reqWorking')}</span></b> ` +
    reqParas(control.requirementAr) +
    `<div class="official"><b>${tr('officialL')}</b><div dir="ltr" style="text-align:left">` +
    `${reqParas(control.requirement)}</div></div>`;
}

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(L.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}


/*
 * The report is the artifact that circulates, so it exists whole in either
 * language rather than as an English document with Arabic decoration.
 */
const T = {
  en: {
    dir: 'ltr', locale: 'en-GB',
    reportTitle: (n) => `${n} NBCC readiness report`,
    kicker: (d) => `Annex (1) to ${d}`,
    subtitle: 'Readiness against the national minimum baseline issued by the National Cyber Security Center (NCSC).',
    assessed: 'Assessed', assessor: 'Assessor', deadline: 'Deadline', band: 'Band',
    unnamed: 'Unnamed entity', notRecorded: 'Not recorded',
    standsH: 'Where the entity stands',
    standsP: 'Implementation counts only what is built. Defensible posture adds requirements sheltered by a valid, in date exception under GOV-2.',
    implementation: 'Implementation', posture: 'Defensible posture',
    controlsMet: 'Controls fully met', controlsGap: 'Controls with no coverage',
    coverage: 'Assessment coverage',
    windowLead: (n) => `${n} days remain in the compliance window.`,
    windowOver: (n) => `The deadline passed ${n} days ago.`,
    windowSub: (p, d, e) => `Published ${p}, due ${d}, ${e}% elapsed`,
    functionH: 'By function',
    functionP: 'Section 5 of the Annex groups the baseline by the six framework functions, with the cloud appendix carried alongside.',
    functionMet: (m, t, c) => `${m} of ${t} controls met, ${c} checks scored`,
    fixH: 'What to fix first',
    fixP: 'Ranked by what each control unblocks, how early its phase falls, how much of it is still open, and how little it costs to start.',
    unblocks: 'Unblocks', noOpen: 'No open work. Every applicable control is fully met.',
    findingsH: 'Findings',
    findingsP: 'Problems with the assessment record itself, separate from the state of the controls. An auditor reads these first.',
    effortLine: (d, w, p) => `Roughly ${d} person days of open work against ${w} working days before the deadline` +
      (p ? `, which needs about ${p} parallel stream${p > 1 ? 's' : ''}` : '') + '.',
    detailH: 'Control detail',
    detailP: (y) => `Every applicable control with its official minimum requirement, the checks behind the score, and the evidence to keep for ${y} years.`,
    reqL: 'Minimum requirement.', reqWorking: 'working translation',
    officialL: 'Official English text',
    checksL: 'Checks', evidenceL: 'Evidence to retain',
    cadence: 'Cadence', effort: 'Effort', phase: 'Phase',
    registerH: 'Evidence register',
    registerP: (n, c, y) => `${n} artifacts across ${c} applicable controls. GOV-5 requires the record to be retained for ${y} years and produced for NCSC on request, so a score with nothing behind it is the gap an audit finds first.`,
    regProducible: 'Recorded and locatable', regOnFile: 'Artifacts on file',
    regStale: 'Stale for their cadence', regClaims: 'Claimed but unevidenced',
    regRange: (a, b) => `Evidence on file was collected between ${a} and ${b}. Freshness is judged against each control's own cadence, so a weekly review and a biennial policy approval are held to different standards.`,
    regNone: 'No evidence has been recorded against this assessment yet.',
    claimsH: 'Controls claimed with nothing to show',
    staleH: 'Evidence that has gone stale',
    thControl: 'Control', thTitle: 'Title', thImpl: 'Implementation',
    thNeeded: 'Artifacts needed', thArtifact: 'Artifact', thCollected: 'Collected',
    thAge: 'Age', thCadence: 'Cadence', days: 'days',
    footGen: 'generated this report from a local assessment file. No data left the machine that produced it.',
    footSrc: (d, g, p) => `Source of truth is Annex (1) to ${d}, published in ${g} on ${p}.`,
    footNot: (a) => `This report is a readiness aid and is not a determination of compliance by the ${a}.`,
    severity: { high: 'high', medium: 'medium', low: 'low' },
    efforts: { low: 'low', medium: 'medium', high: 'high' },
    cadences: {},
    noFindings: 'No findings. Every applicable control carries an owner, an assessed status, and a valid exception record where one is claimed.',
    waitsOn: 'waits on', none: 'none', thState: 'State', thOpen: 'Open',
    owner: 'Owner', unassigned: 'unassigned', target: 'Target',
    edmark: 'summary', edmarkT: 'Appendix A prints no Purpose column. This summary is not Annex text.'
  },
  ar: {
    dir: 'rtl', locale: 'ar-KW',
    reportTitle: (n) => `تقرير جاهزية ${n} للضوابط الوطنية الأساسية`,
    kicker: (d) => `الملحق الأول من ${d}`,
    subtitle: 'الجاهزية مقابل الحد الأدنى الوطني الصادر عن المركز الوطني للأمن السيبراني.',
    assessed: 'تاريخ التقييم', assessor: 'جهة التقييم', deadline: 'الموعد النهائي', band: 'المستوى',
    unnamed: 'جهة دون اسم', notRecorded: 'غير مسجل',
    standsH: 'أين تقف الجهة اليوم',
    standsP: 'نسبة التطبيق تحسب ما بني فعلا وحده، أما الوضع القابل للإثبات فيضيف إليه ما يستره استثناء صحيح ساري المفعول وفق الضابط GOV-2.',
    implementation: 'نسبة التطبيق', posture: 'الوضع القابل للإثبات',
    controlsMet: 'ضوابط مستوفاة بالكامل', controlsGap: 'ضوابط دون تغطية',
    coverage: 'نسبة تغطية التقييم',
    windowLead: (n) => `بقي ${n} يوما من مهلة الامتثال.`,
    windowOver: (n) => `مضى ${n} يوما على الموعد النهائي.`,
    windowSub: (p, d, e) => `نشر في ${p} ويستحق في ${d}، وقد انقضى ${e}٪ من المدة`,
    functionH: 'بحسب الوظيفة',
    functionP: 'يصنف البند الخامس من الملحق هذه الضوابط في ست وظائف للإطار، ويقابلها ملحق الحوسبة السحابية.',
    functionMet: (m, t, c) => `${m} من ${t} ضابطا مستوفاة، و${c} بندا مقيسا`,
    fixH: 'ما يعالج أولا',
    fixP: 'مرتبة بحسب ما يفتحه كل ضابط من طريق أمام غيره وقرب مرحلته وحجم ما تبقى منه وقلة كلفة البدء فيه.',
    unblocks: 'يفتح الطريق أمام', noOpen: 'لا عمل مفتوح، فكل ضابط منطبق مستوفى بالكامل.',
    findingsH: 'الملاحظات',
    findingsP: 'مسائل تتعلق بسجل التقييم نفسه لا بحالة الضوابط، والمدقق يقرأها أولا.',
    effortLine: (d, w, p) => `نحو ${d} يوم عمل مفتوح مقابل ${w} يوم عمل قبل الموعد النهائي` +
      (p ? `، وهو ما يحتاج نحو ${p} من مسارات العمل المتوازية` : '') + '.',
    detailH: 'تفصيل الضوابط',
    detailP: (y) => `كل ضابط منطبق مع الحد الأدنى المطلوب وبنود التحقق التي بني عليها التقييم والأدلة الواجب حفظها ${y} سنوات.`,
    reqL: 'الحد الأدنى المطلوب.', reqWorking: 'ترجمة عاملة',
    officialL: 'النص الرسمي بالإنجليزية',
    checksL: 'بنود التحقق', evidenceL: 'الأدلة الواجب حفظها',
    cadence: 'الدورية', effort: 'الجهد', phase: 'المرحلة',
    registerH: 'سجل الأدلة',
    registerP: (n, c, y) => `${n} دليلا موزعة على ${c} ضابطا منطبقا، ويوجب الضابط GOV-5 حفظ السجل ${y} سنوات وتقديمه للمركز عند الطلب، لذا فالنتيجة التي لا يقوم خلفها دليل هي أول ثغرة يجدها التدقيق.`,
    regProducible: 'مسجل ويمكن تقديمه', regOnFile: 'أدلة محفوظة',
    regStale: 'تجاوزت دوريتها', regClaims: 'ادعي استيفاؤها دون دليل',
    regRange: (a, b) => `جمعت الأدلة المحفوظة بين ${a} و${b}، وتقاس حداثتها بدورية كل ضابط على حدة، فالمراجعة الأسبوعية واعتماد السياسة كل سنتين لا يخضعان لمعيار واحد.`,
    regNone: 'لم يسجل أي دليل على هذا التقييم بعد.',
    claimsH: 'ضوابط ادعي استيفاؤها دون دليل',
    staleH: 'أدلة تجاوزت دوريتها',
    thControl: 'الضابط', thTitle: 'العنوان', thImpl: 'نسبة التطبيق',
    thNeeded: 'الأدلة المطلوبة', thArtifact: 'الدليل', thCollected: 'تاريخ الجمع',
    thAge: 'العمر', thCadence: 'الدورية', days: 'يوما',
    footGen: 'أنتجت هذا التقرير من ملف تقييم محلي، ولم تغادر أي بيانات الجهاز الذي أنتجه.',
    footSrc: (d, g, p) => `المرجع هو الملحق الأول من ${d} المنشور في ${g} بتاريخ ${p}.`,
    footNot: (a) => `هذا التقرير أداة للاستعداد وليس حكما بالامتثال من ${a}.`,
    severity: { high: 'مرتفعة', medium: 'متوسطة', low: 'منخفضة' },
    efforts: { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' },
    cadences: { annual:'سنويا', biennial:'كل سنتين', 'per hire':'عند كل تعيين', weekly:'أسبوعيا',
      monthly:'شهريا', quarterly:'ربع سنوي', continuous:'مستمر', 'per incident':'عند كل حادث',
      'per engagement':'عند كل تعاقد' },
    noFindings: 'لا ملاحظات، فكل ضابط منطبق له مسؤول وحالة مقيمة وسجل استثناء صحيح حيثما ادعي.',
    waitsOn: 'ينتظر', none: 'لا شيء', thState: 'الحالة', thOpen: 'المفتوح',
    owner: 'المسؤول', unassigned: 'غير محدد', target: 'التاريخ المستهدف',
    edmark: 'تلخيص', edmarkT: 'لا يتضمن الملحق الأول عمود الغرض، فهذا التلخيص ليس من نص الملحق.'
  }
};

let L = T.en;
function tr(k, ...a) {
  const v = L[k] !== undefined ? L[k] : T.en[k];
  return typeof v === 'function' ? v(...a) : v;
}
const isAr = () => L.dir === 'rtl';
// Control text that exists in both languages.
const cx = (c, field) => (isAr() && c[`${field}Ar`] ? c[`${field}Ar`] : c[field]);

const REPORT_CSS = `
${BASE_CSS}
.masthead{background:var(--ink); color:var(--paper); padding:34px 0 30px}
.masthead .wrap{display:flex; flex-wrap:wrap; gap:26px; justify-content:space-between; align-items:flex-end}
.masthead h1{color:var(--paper); max-width:19ch}
.masthead .kicker{color:#9FBBAE; font-size:.95rem; margin-bottom:9px}
.masthead dl{margin:0; display:grid; grid-template-columns:auto auto; gap:3px 18px; font-size:.88rem}
.masthead dt{color:#8FA6AE}
.masthead dd{margin:0; font-family:var(--mono); font-variant-numeric:tabular-nums}
section{padding:34px 0; border-top:1px solid var(--line)}
section:first-of-type{border-top:none}
.section-head{display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin-bottom:18px; flex-wrap:wrap}
.section-head p{margin:0; color:var(--slate); font-size:.92rem; max-width:62ch}
.headline{display:grid; grid-template-columns:repeat(auto-fit,minmax(168px,1fr)); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:var(--r); overflow:hidden}
.headline > div{background:var(--paper); padding:16px 18px}
.headline .v{font-family:var(--mono); font-size:2.05rem; font-variant-numeric:tabular-nums; letter-spacing:-.04em; line-height:1.1}
.headline .k{font-size:.83rem; color:var(--slate); margin-top:3px}
.window{background:var(--paper-alt); border:1px solid var(--line); border-radius:var(--r); padding:18px 20px 8px}
.window .lead{display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:6px; font-size:.9rem}
.fnrow{display:grid; grid-template-columns:118px 1fr 62px; gap:14px; align-items:center; padding:9px 0; border-bottom:1px solid var(--line)}
.fnrow:last-child{border-bottom:none}
.fnrow .nm{font-weight:600; font-size:.94rem}
.fnrow .pc{font-family:var(--mono); font-variant-numeric:tabular-nums; text-align:right; font-size:.95rem}
.finding{display:grid; grid-template-columns:64px 74px 1fr; gap:12px; padding:11px 0; border-bottom:1px solid var(--line); font-size:.9rem}
.finding:last-child{border-bottom:none}
.finding .fix{color:var(--slate); font-size:.85rem; margin-top:3px}
.sev{font-size:.74rem; font-weight:600; padding:2px 8px; border-radius:100px; text-align:center; align-self:start}
.sev-high{background:var(--crimson-soft); color:var(--crimson)}
.sev-medium{background:var(--ochre-soft); color:#8A6508}
.sev-low{background:var(--paper-alt); color:var(--slate)}
/* The printed report is a register too, so entries are ruled rather than boxed
   and 44 of them stack without becoming 44 objects on the page. */
details.ctl{border-top:1px solid var(--line); background:none}
details.ctl:last-of-type{border-bottom:1px solid var(--line)}
details.ctl > summary{padding:13px 2px; cursor:pointer; display:flex; gap:13px; align-items:baseline; flex-wrap:wrap; list-style:none}
details.ctl > summary::-webkit-details-marker{display:none}
details.ctl[open] > summary{padding-bottom:3px}
.ctl .body{padding:4px 2px 22px; max-width:82ch}
.ctl .t{font-weight:500; flex:1; min-width:190px}
.ctl[open] .t{font-weight:600}
.reqlist{margin:7px 0 0 0; padding-inline-start:19px}
.reqlist li{margin:4px 0}
.reg{width:100%; border-collapse:collapse; font-size:.88rem; margin-top:4px}
.reg th{text-align:left; font-weight:600; color:var(--slate); border-bottom:1px solid var(--line-2); padding:7px 10px 7px 0; font-size:.8rem; letter-spacing:.02em; text-transform:uppercase}
.reg td{padding:7px 10px 7px 0; border-bottom:1px solid var(--line); vertical-align:top}
.reg tr:last-child td{border-bottom:none}
.reg .num{text-align:right; font-family:var(--mono); font-variant-numeric:tabular-nums; white-space:nowrap}
.reg th.num{text-align:right}
.official{margin-top:11px; border-top:1px dashed var(--line-2); padding-top:9px}
.official > b{display:block; font-size:.8rem; color:var(--slate); margin-bottom:5px}
.official > div{font-size:.86rem; color:var(--slate)}
.edmark{font-size:.7rem; letter-spacing:.04em; text-transform:uppercase; border:1px solid var(--line-2); border-radius:3px; padding:1px 5px; color:var(--slate); vertical-align:1px}
.req{background:var(--paper-alt); border-left:3px solid var(--ink); padding:12px 15px; border-radius:0 var(--r) var(--r) 0; font-size:.9rem; margin:0 0 15px}
.chk{list-style:none; padding:0; margin:0 0 15px}
.chk li{display:grid; grid-template-columns:26px 1fr 108px; gap:10px; padding:7px 0; border-bottom:1px solid var(--line); font-size:.88rem; align-items:start}
.chk li:last-child{border-bottom:none}
.chk li > .pill{justify-self:end; align-self:start}
.chk .i{font-family:var(--mono); color:var(--slate-soft); font-size:.78rem; padding-top:2px}
.meta{display:flex; gap:8px 20px; flex-wrap:wrap; font-size:.84rem; color:var(--slate); margin-top:12px; padding-top:12px; border-top:1px solid var(--line)}
.meta b{color:var(--ink); font-weight:600}
footer{background:var(--ink); color:#9FB2BA; padding:26px 0; font-size:.85rem}
footer a{color:#9FD5B4}
@media(max-width:640px){
  .fnrow{grid-template-columns:96px 1fr 54px; gap:10px}
  .finding{grid-template-columns:1fr; gap:5px}
  .chk li{grid-template-columns:1fr; gap:4px}
  .masthead .wrap{align-items:flex-start}
}
`;

function headline(result) {
  const s = result.scores;
  return `<div class="headline">
    <div><div class="v" style="color:${scoreColor(s.implementation)}">${s.implementation}%</div><div class="k">${tr('implementation')}</div></div>
    <div><div class="v" style="color:${scoreColor(s.posture)}">${s.posture}%</div><div class="k">${tr('posture')}</div></div>
    <div><div class="v">${s.controlsMet}<span style="color:var(--slate-soft);font-size:1.15rem">/${s.controlsInScope}</span></div><div class="k">${tr('controlsMet')}</div></div>
    <div><div class="v" style="color:${s.controlsGap ? TOKENS.crimson : TOKENS.green}">${s.controlsGap}</div><div class="k">${tr('controlsGap')}</div></div>
    <div><div class="v">${s.coverage}%</div><div class="k">${tr('coverage')}</div></div>
  </div>`;
}

function windowBlock(status) {
  const label = status.overdue
    ? tr('windowOver', Math.abs(status.remainingDays))
    : tr('windowLead', status.remainingDays);
  return `<div class="window">
    <div class="lead">
      <span><b>${label}</b></span>
      <span class="muted">${tr('windowSub', fmtDate(status.publishedOn), fmtDate(status.deadline), status.elapsedPercent)}</span>
    </div>
    ${windowScaleSVG(status, { lang: L.dir === 'rtl' ? 'ar' : 'en' })}
  </div>`;
}

function functionBlock(result) {
  return result.byFunction
    .map((f) => {
      const fn = getFunction(f.id);
      return `<div class="fnrow">
        <div class="nm">${esc(isAr() ? f.nameAr : f.name)}</div>
        <div><div class="bar"><i style="width:${f.implementation}%;background:${f.color}"></i></div>
          <div class="muted" style="font-size:.78rem;margin-top:4px">${tr('functionMet', f.met, f.controls, f.scoredChecks)}</div></div>
        <div class="pc">${f.implementation}%</div>
      </div>`;
    })
    .join('');
}

function findingsBlock(result) {
  if (!result.findings.length) {
    return `<p class="muted">${tr('noFindings')}</p>`;
  }
  return result.findings
    .slice(0, 40)
    .map(
      (f) => `<div class="finding">
      <span class="cid">${esc(f.control)}</span>
      <span class="sev sev-${f.severity}">${esc(L.severity[f.severity] || f.severity)}</span>
      <div><div>${esc(isAr() && f.issueAr ? f.issueAr : f.issue)}</div><div class="fix">${esc(isAr() && f.fixAr ? f.fixAr : f.fix)}</div></div>
    </div>`
    )
    .join('');
}

function backlogBlock(plan) {
  const rows = plan.backlog
    .slice(0, 25)
    .map(
      (b) => `<tr>
      <td><span class="cid">${esc(b.id)}</span></td>
      <td>${esc(isAr() ? b.titleAr || b.title : b.title)}${b.waitingOn.length ? `<div class="muted" style="font-size:.79rem">${tr('waitsOn')} ${b.waitingOn.map(esc).join(', ')}</div>` : ''}</td>
      <td>${statusPill(b.state, L.dir === 'rtl' ? 'ar' : 'en')}</td>
      <td class="num">${b.phase}</td>
      <td>${esc(tr('efforts')[b.effort] || b.effort)}</td>
      <td class="num">${b.openChecks}</td>
      <td>${b.unblocks.length ? b.unblocks.map(esc).join(', ') : `<span class="muted">${tr('none')}</span>`}</td>
    </tr>`
    )
    .join('');
  return `<table>
    <thead><tr><th>${tr('thControl')}</th><th>${tr('thTitle')}</th><th>${tr('thState')}</th><th>${tr('phase')}</th><th>${tr('effort')}</th><th>${tr('thOpen')}</th><th>${tr('unblocks')}</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7" class="muted">${tr('noOpen')}</td></tr>`}</tbody>
  </table>`;
}

function controlDetail(row) {
  const control = getControl(row.id);
  const map = mappingsFor(row.id);
  const checks = cx(control, 'checks')
    .map(
      (text, i) => `<li><span class="i">${String(i + 1).padStart(2, '0')}</span>
      <span>${esc(text)}</span>${statusPill(row.statuses[i], L.dir === 'rtl' ? 'ar' : 'en')}</li>`
    )
    .join('');
  const evidence = cx(control, 'evidence').map((e) => `<li>${esc(e)}</li>`).join('');

  return `<details class="ctl">
    <summary>
      <span class="cid">${esc(row.id)}</span>
      <span class="t">${esc(isAr() ? row.titleAr || row.title : row.title)}</span>
      ${statusPill(row.state, L.dir === 'rtl' ? 'ar' : 'en')}
      <span class="num muted" style="font-size:.85rem">${row.implementation === null ? '' : row.implementation + '%'}</span>
    </summary>
    <div class="body">
      <p class="muted" style="margin:0 0 12px">${esc(cx(control, 'purpose'))}${
        control.purposeSource === 'editorial'
          ? ` <span class="edmark" title="${esc(tr('edmarkT'))}">${esc(tr('edmark'))}</span>`
          : ''}</p>
      <div class="req">${renderRequirement(control)}</div>
      <h4 style="margin:0 0 8px">${tr('checksL')}</h4>
      <ul class="chk">${checks}</ul>
      <h4 style="margin:0 0 8px">${tr('evidenceL')}</h4>
      <ul style="margin:0; padding-inline-start:20px; font-size:.88rem; color:var(--slate)">${evidence}</ul>
      <div class="meta">
        <span>${tr('owner')} <b>${esc(row.owner || tr('unassigned'))}</b></span>
        <span>${tr('cadence')} <b>${esc(tr('cadences')[control.cadence] || control.cadence)}</b></span>
        <span>${tr('effort')} <b>${esc(tr('efforts')[control.effort] || control.effort)}</b></span>
        <span>${tr('phase')} <b>${control.phase}</b></span>
        <span>NIST CSF <b dir="ltr">${map.csf.map(esc).join(', ')}</b></span>
        <span>CIS v8.1 <b dir="ltr">${map.cis.map(esc).join(', ')}</b></span>
        <span>ISO 27001 <b dir="ltr">${map.iso.map(esc).join(', ')}</b></span>
        ${row.targetDate ? `<span>${tr('target')} <b dir="ltr">${esc(row.targetDate)}</b></span>` : ''}
      </div>
      ${row.notes ? `<p class="muted" style="margin:12px 0 0;font-size:.87rem">${esc(row.notes)}</p>` : ''}
    </div>
  </details>`;
}

/*
 * Produces one HTML file with no external dependency beyond an optional web
 * font, so it can be mailed to an auditor, filed as the record required by
 * GOV-5, or printed without anything breaking.
 */
export function renderReport(assessment, options = {}) {
  L = options.lang === 'ar' ? T.ar : T.en;
  const result = assess(assessment);
  const today = options.today || new Date();
  const plan = buildPlan(assessment, today);
  const pack = evidencePack(assessment);
  const reg = evidenceRegister(assessment, today);
  const claims = unevidencedClaims(assessment, result, today);
  const status = plan.deadline;
  const entityName = (result.entity && result.entity.name) || tr('unnamed');
  const title = tr('reportTitle', entityName);

  const grouped = result.byFunction
    .map((f) => {
      const rows = result.controls.filter((c) => c.fn === f.id && c.inScope);
      if (!rows.length) return '';
      const fn = getFunction(f.id);
      return `<h3 style="margin:22px 0 10px;display:flex;gap:10px;align-items:baseline">
        <span style="width:9px;height:9px;border-radius:2px;background:${f.color};display:inline-block"></span>
        ${esc(isAr() ? fn.nameAr : fn.name)}
      </h3>${rows.map(controlDetail).join('')}`;
    })
    .join('');

  return `<!doctype html>
<html lang="${L.dir === 'rtl' ? 'ar' : 'en'}" dir="${L.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(tr('subtitle'))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" rel="stylesheet">
<style>${REPORT_CSS}</style>
</head>
<body>
<header class="masthead">
  <div class="wrap">
    <div>
      <div class="kicker">${esc(tr('kicker', isAr() ? REGULATION.decisionAr : REGULATION.decision, isAr() ? REGULATION.titleAr : REGULATION.title))}</div>
      <h1>${esc(entityName)}</h1>
      <p style="color:#B9CDD5;margin:10px 0 0;max-width:56ch;font-size:.95rem">
        ${esc(tr('subtitle'))}
      </p>
    </div>
    <dl>
      <dt>${tr('assessed')}</dt><dd dir="ltr">${esc(result.assessmentDate)}</dd>
      <dt>${tr('assessor')}</dt><dd>${esc(result.assessor || tr('notRecorded'))}</dd>
      <dt>${tr('deadline')}</dt><dd dir="ltr">${esc(REGULATION.deadline)}</dd>
      <dt>${tr('band')}</dt><dd>${esc(isAr() ? result.scores.band.labelAr : result.scores.band.label)}</dd>
    </dl>
  </div>
</header>

<main class="wrap">

<section>
  <div class="section-head">
    <h2>${tr('standsH')}</h2>
    <p>${tr('standsP')}</p>
  </div>
  ${headline(result)}
  <div style="margin-top:20px">${windowBlock(status)}</div>
</section>

<section>
  <div class="section-head">
    <h2>${tr('functionH')}</h2>
    <p>${tr('functionP')}</p>
  </div>
  ${functionBlock(result)}
</section>

<section>
  <div class="section-head">
    <h2>${tr('fixH')}</h2>
    <p>${tr('fixP')}</p>
  </div>
  ${backlogBlock(plan)}
  <p class="muted" style="margin-top:14px;font-size:.88rem">
    ${tr('effortLine', plan.effort.totalPersonDays, plan.effort.workingDaysRemaining, plan.effort.parallelStreamsNeeded)}
  </p>
</section>

<section>
  <div class="section-head">
    <h2>${tr('findingsH')}</h2>
    <p>${tr('findingsP')}</p>
  </div>
  ${findingsBlock(result)}
</section>

<section>
  <div class="section-head">
    <h2>${tr('detailH')}</h2>
    <p>${tr('detailP', REGULATION.recordRetentionYears)}</p>
  </div>
  ${grouped}
</section>

<section>
  <div class="section-head">
    <h2>${tr('registerH')}</h2>
    <p>${tr('registerP', reg.totalArtifacts, result.scores.controlsInScope, REGULATION.recordRetentionYears)}</p>
  </div>

  <div class="headline">
    <div><div class="v" style="color:${scoreColor(reg.producible)}">${reg.producible}%</div><div class="k">${tr('regProducible')}</div></div>
    <div><div class="v">${reg.counts.held}<span style="color:var(--slate-soft);font-size:1.15rem">/${reg.totalArtifacts}</span></div><div class="k">${tr('regOnFile')}</div></div>
    <div><div class="v" style="color:${reg.counts.stale ? TOKENS.ochre : TOKENS.ink}">${reg.counts.stale}</div><div class="k">${tr('regStale')}</div></div>
    <div><div class="v" style="color:${claims.length ? TOKENS.crimson : TOKENS.green}">${claims.length}</div><div class="k">${tr('regClaims')}</div></div>
  </div>

  ${reg.oldestCollected ? `<p class="muted" style="font-size:.9rem">${tr('regRange', fmtDate(reg.oldestCollected), fmtDate(reg.newestCollected))}</p>` : `<p class="muted" style="font-size:.9rem">${tr('regNone')}</p>`}

  ${claims.length > 0 ? `
  <h3 style="margin:22px 0 8px; font-size:1rem">${tr('claimsH')}</h3>
  <table class="reg">
    <thead><tr><th>${tr('thControl')}</th><th>${tr('thTitle')}</th><th class="num">${tr('thImpl')}</th><th class="num">${tr('thNeeded')}</th></tr></thead>
    <tbody>${claims.map((c) => `<tr>
      <td><span class="cid">${esc(c.control)}</span></td>
      <td>${esc(isAr() ? getControl(c.control).titleAr : c.title)}</td>
      <td class="num">${c.implementation}%</td>
      <td class="num">${c.artifactsNeeded}</td>
    </tr>`).join('')}</tbody>
  </table>` : ''}

  ${reg.counts.stale > 0 ? `
  <h3 style="margin:22px 0 8px; font-size:1rem">${tr('staleH')}</h3>
  <table class="reg">
    <thead><tr><th>${tr('thControl')}</th><th>${tr('thArtifact')}</th><th>${tr('thCollected')}</th><th class="num">${tr('thAge')}</th><th>${tr('thCadence')}</th></tr></thead>
    <tbody>${reg.items.filter((i) => i.state === 'stale').map((i) => `<tr>
      <td><span class="cid">${esc(i.control)}</span></td>
      <td>${esc(isAr() ? i.artifactAr : i.artifact)}</td>
      <td>${fmtDate(i.collected)}</td>
      <td class="num">${i.ageDays} ${tr('days')}</td>
      <td>${esc(tr('cadences')[i.cadence] || i.cadence)}</td>
    </tr>`).join('')}</tbody>
  </table>` : ''}
</section>

</main>

<footer>
  <div class="wrap">
    <p style="margin:0 0 6px"><b style="color:var(--paper)">${isAr() ? 'أدوات الضوابط الوطنية الأساسية للأمن السيبراني' : 'Kuwait NBCC Toolkit'}</b> ${tr('footGen')}</p>
    <p style="margin:0">
      ${esc(tr('footSrc', isAr() ? REGULATION.decisionAr : REGULATION.decision, isAr() ? REGULATION.gazetteAr || REGULATION.gazette : REGULATION.gazette, fmtDate(REGULATION.publishedOn)))}
      ${esc(tr('footNot', isAr() ? REGULATION.authorityAr : REGULATION.authority))}
    </p>
  </div>
</footer>
</body>
</html>`;
}

export function renderMarkdown(assessment, options = {}) {
  const result = assess(assessment);
  const plan = buildPlan(assessment, options.today || new Date());
  const s = result.scores;
  const lines = [];

  lines.push(`# ${result.entity.name || 'Unnamed entity'} NBCC readiness`);
  lines.push('');
  lines.push(`${REGULATION.decision}, ${REGULATION.title}. Assessed ${result.assessmentDate}.`);
  lines.push('');
  lines.push('| Measure | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Implementation | ${s.implementation}% |`);
  lines.push(`| Defensible posture | ${s.posture}% |`);
  lines.push(`| Band | ${s.band.label} |`);
  lines.push(`| Controls met | ${s.controlsMet} of ${s.controlsInScope} |`);
  lines.push(`| Controls with no coverage | ${s.controlsGap} |`);
  lines.push(`| Assessment coverage | ${s.coverage}% |`);
  lines.push(`| Days to deadline | ${plan.deadline.remainingDays} |`);
  lines.push('');
  lines.push('## By function');
  lines.push('');
  lines.push('| Function | Controls | Met | Implementation |');
  lines.push('| --- | --- | --- | --- |');
  for (const f of result.byFunction) {
    lines.push(`| ${f.name} | ${f.controls} | ${f.met} | ${f.implementation}% |`);
  }
  lines.push('');
  lines.push('## Priority backlog');
  lines.push('');
  lines.push('| Control | Title | State | Phase | Effort | Open checks |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const b of plan.backlog.slice(0, 20)) {
    lines.push(`| ${b.id} | ${b.title} | ${b.state} | ${b.phase} | ${b.effort} | ${b.openChecks} |`);
  }
  if (result.findings.length) {
    lines.push('');
    lines.push('## Findings');
    lines.push('');
    for (const f of result.findings.slice(0, 30)) {
      lines.push(`- **${f.severity}** ${f.control}: ${f.issue} ${f.fix}`);
    }
  }
  lines.push('');
  lines.push(
    `Source of truth is Annex (1) to ${REGULATION.decision}, published in ${REGULATION.gazette} on ${REGULATION.publishedOn}.`
  );
  return lines.join('\n');
}

function csvCell(value) {
  const s = String(value === undefined || value === null ? '' : value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function renderCSV(assessment) {
  const result = assess(assessment);
  const rows = [
    ['control', 'function', 'title', 'check_index', 'check', 'status', 'owner', 'state', 'phase', 'effort', 'csf', 'cis', 'iso']
  ];
  for (const row of result.controls) {
    if (!row.inScope) continue;
    const control = getControl(row.id);
    const map = mappingsFor(row.id);
    control.checks.forEach((text, i) => {
      rows.push([
        row.id,
        row.fn,
        control.title,
        i + 1,
        text,
        row.statuses[i],
        row.owner || '',
        row.state,
        control.phase,
        control.effort,
        map.csf.join(' '),
        map.cis.join(' '),
        map.iso.join(' ')
      ]);
    });
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

export { deadlineStatus };
