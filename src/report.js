// Renders an assessment into a self contained HTML report, markdown or CSV.

import { REGULATION, getControl, getFunction } from './catalog.js';
import { assess } from './assess.js';
import { buildPlan, deadlineStatus, evidencePack } from './plan.js';
import { mappingsFor } from './crosswalk.js';
import { BASE_CSS, TOKENS, windowScaleSVG, statusPill, scoreColor } from './theme.js';

/*
 * Some minimum requirements are bulleted in the Annex, and the bullets carry
 * meaning, so they are reproduced as a list rather than flattened into prose.
 */
function renderRequirement(control) {
  let html = '<b>Minimum requirement.</b> ';
  let open = false;
  for (const para of control.requirement.split('\n')) {
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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

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
details.ctl{border:1px solid var(--line); border-radius:var(--r); margin-bottom:9px; background:var(--paper); overflow:hidden}
details.ctl > summary{padding:12px 15px; cursor:pointer; display:flex; gap:12px; align-items:center; flex-wrap:wrap; list-style:none}
details.ctl > summary::-webkit-details-marker{display:none}
details.ctl > summary:hover{background:var(--paper-alt)}
details.ctl[open] > summary{border-bottom:1px solid var(--line); background:var(--paper-alt)}
.ctl .body{padding:15px 17px}
.ctl .t{font-weight:600; flex:1; min-width:190px}
.reqlist{margin:7px 0 0 0; padding-inline-start:19px}
.reqlist li{margin:4px 0}
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
    <div><div class="v" style="color:${scoreColor(s.implementation)}">${s.implementation}%</div><div class="k">Implementation</div></div>
    <div><div class="v" style="color:${scoreColor(s.posture)}">${s.posture}%</div><div class="k">Defensible posture</div></div>
    <div><div class="v">${s.controlsMet}<span style="color:var(--slate-soft);font-size:1.15rem">/${s.controlsInScope}</span></div><div class="k">Controls fully met</div></div>
    <div><div class="v" style="color:${s.controlsGap ? TOKENS.crimson : TOKENS.green}">${s.controlsGap}</div><div class="k">Controls with no coverage</div></div>
    <div><div class="v">${s.coverage}%</div><div class="k">Assessment coverage</div></div>
  </div>`;
}

function windowBlock(status) {
  const label = status.overdue
    ? `The compliance deadline passed ${Math.abs(status.remainingDays)} days ago.`
    : `${status.remainingDays} days remain in the compliance window.`;
  return `<div class="window">
    <div class="lead">
      <span><b>${label}</b></span>
      <span class="muted">Published ${fmtDate(status.publishedOn)}, due ${fmtDate(status.deadline)}, ${status.elapsedPercent}% elapsed</span>
    </div>
    ${windowScaleSVG(status)}
  </div>`;
}

function functionBlock(result) {
  return result.byFunction
    .map((f) => {
      const fn = getFunction(f.id);
      return `<div class="fnrow">
        <div class="nm">${esc(f.name)}<div class="muted" style="font-weight:400;font-size:.8rem">${esc(fn ? fn.nameAr : '')}</div></div>
        <div><div class="bar"><i style="width:${f.implementation}%;background:${f.color}"></i></div>
          <div class="muted" style="font-size:.78rem;margin-top:4px">${f.met} of ${f.controls} controls met, ${f.scoredChecks} checks scored</div></div>
        <div class="pc">${f.implementation}%</div>
      </div>`;
    })
    .join('');
}

function findingsBlock(result) {
  if (!result.findings.length) {
    return '<p class="muted">No findings. Every applicable control carries an owner, an assessed status, and a valid exception record where one is claimed.</p>';
  }
  return result.findings
    .slice(0, 40)
    .map(
      (f) => `<div class="finding">
      <span class="cid">${esc(f.control)}</span>
      <span class="sev sev-${f.severity}">${f.severity}</span>
      <div><div>${esc(f.issue)}</div><div class="fix">${esc(f.fix)}</div></div>
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
      <td>${esc(b.title)}${b.waitingOn.length ? `<div class="muted" style="font-size:.79rem">waits on ${b.waitingOn.map(esc).join(', ')}</div>` : ''}</td>
      <td>${statusPill(b.state)}</td>
      <td class="num">${b.phase}</td>
      <td>${esc(b.effort)}</td>
      <td class="num">${b.openChecks}</td>
      <td>${b.unblocks.length ? b.unblocks.map(esc).join(', ') : '<span class="muted">none</span>'}</td>
    </tr>`
    )
    .join('');
  return `<table>
    <thead><tr><th>Control</th><th>Title</th><th>State</th><th>Phase</th><th>Effort</th><th>Open</th><th>Unblocks</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="muted">No open work. Every applicable control is fully met.</td></tr>'}</tbody>
  </table>`;
}

function controlDetail(row) {
  const control = getControl(row.id);
  const map = mappingsFor(row.id);
  const checks = control.checks
    .map(
      (text, i) => `<li><span class="i">${String(i + 1).padStart(2, '0')}</span>
      <span>${esc(text)}</span>${statusPill(row.statuses[i])}</li>`
    )
    .join('');
  const evidence = control.evidence.map((e) => `<li>${esc(e)}</li>`).join('');

  return `<details class="ctl">
    <summary>
      <span class="cid">${esc(row.id)}</span>
      <span class="t">${esc(row.title)}</span>
      ${statusPill(row.state)}
      <span class="num muted" style="font-size:.85rem">${row.implementation === null ? '' : row.implementation + '%'}</span>
    </summary>
    <div class="body">
      <p class="muted" style="margin:0 0 12px">${esc(control.purpose)}${
        control.purposeSource === 'editorial'
          ? ' <span class="edmark" title="Appendix A prints no Purpose column. This summary is not Annex text.">summary</span>'
          : ''}</p>
      <div class="req">${renderRequirement(control)}</div>
      <h4 style="margin:0 0 8px">Checks</h4>
      <ul class="chk">${checks}</ul>
      <h4 style="margin:0 0 8px">Evidence to retain</h4>
      <ul style="margin:0; padding-left:20px; font-size:.88rem; color:var(--slate)">${evidence}</ul>
      <div class="meta">
        <span>Owner <b>${esc(row.owner || 'unassigned')}</b></span>
        <span>Cadence <b>${esc(control.cadence)}</b></span>
        <span>Effort <b>${esc(control.effort)}</b></span>
        <span>Phase <b>${control.phase}</b></span>
        <span>NIST CSF <b>${map.csf.map(esc).join(', ')}</b></span>
        <span>CIS v8.1 <b>${map.cis.map(esc).join(', ')}</b></span>
        <span>ISO 27001 <b>${map.iso.map(esc).join(', ')}</b></span>
        ${row.targetDate ? `<span>Target <b>${esc(row.targetDate)}</b></span>` : ''}
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
  const result = assess(assessment);
  const plan = buildPlan(assessment, options.today || new Date());
  const pack = evidencePack(assessment);
  const status = plan.deadline;
  const entityName = (result.entity && result.entity.name) || 'Unnamed entity';
  const title = `${entityName} NBCC readiness report`;

  const grouped = result.byFunction
    .map((f) => {
      const rows = result.controls.filter((c) => c.fn === f.id && c.inScope);
      if (!rows.length) return '';
      const fn = getFunction(f.id);
      return `<h3 style="margin:22px 0 10px;display:flex;gap:10px;align-items:baseline">
        <span style="width:9px;height:9px;border-radius:2px;background:${f.color};display:inline-block"></span>
        ${esc(f.name)} <span class="muted" style="font-weight:400;font-size:.9rem">${esc(fn.nameAr)}</span>
      </h3>${rows.map(controlDetail).join('')}`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="Readiness assessment against the Kuwait National Basic Cybersecurity Controls, Annex 1 to NCSC Decision No. 2 of 2026.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" rel="stylesheet">
<style>${REPORT_CSS}</style>
</head>
<body>
<header class="masthead">
  <div class="wrap">
    <div>
      <div class="kicker">${esc(REGULATION.decision)} &middot; ${esc(REGULATION.title)}</div>
      <h1>${esc(entityName)}</h1>
      <p style="color:#B9CDD5;margin:10px 0 0;max-width:56ch;font-size:.95rem">
        Readiness against the national minimum baseline issued by the ${esc(REGULATION.authority)}.
      </p>
    </div>
    <dl>
      <dt>Assessed</dt><dd>${esc(result.assessmentDate)}</dd>
      <dt>Assessor</dt><dd>${esc(result.assessor || 'not recorded')}</dd>
      <dt>Deadline</dt><dd>${esc(REGULATION.deadline)}</dd>
      <dt>Band</dt><dd>${esc(result.scores.band.label)}</dd>
    </dl>
  </div>
</header>

<main class="wrap">

<section>
  <div class="section-head">
    <h2>Where the entity stands</h2>
    <p>Implementation counts only what is built. Defensible posture adds requirements sheltered by a valid, in date exception under GOV-2.</p>
  </div>
  ${headline(result)}
  <div style="margin-top:20px">${windowBlock(status)}</div>
</section>

<section>
  <div class="section-head">
    <h2>By function</h2>
    <p>Section 5 of the Annex groups the baseline by the six NIST CSF functions, with the cloud appendix carried alongside.</p>
  </div>
  ${functionBlock(result)}
</section>

<section>
  <div class="section-head">
    <h2>What to fix first</h2>
    <p>Ranked by how much a control unblocks, how early its phase falls, how much of it is open, and how little it costs to start.</p>
  </div>
  ${backlogBlock(plan)}
  <p class="muted" style="margin-top:14px;font-size:.88rem">
    Roughly ${plan.effort.totalPersonDays} person days of open work against ${plan.effort.workingDaysRemaining} working days before the deadline${plan.effort.parallelStreamsNeeded ? `, which needs about ${plan.effort.parallelStreamsNeeded} parallel stream${plan.effort.parallelStreamsNeeded > 1 ? 's' : ''}` : ''}.
  </p>
</section>

<section>
  <div class="section-head">
    <h2>Findings</h2>
    <p>Problems with the assessment record itself, separate from the state of the controls. An auditor reads these first.</p>
  </div>
  ${findingsBlock(result)}
</section>

<section>
  <div class="section-head">
    <h2>Control detail</h2>
    <p>Every applicable control with its official minimum requirement, the checks behind the score, and the evidence to keep for ${REGULATION.recordRetentionYears} years.</p>
  </div>
  ${grouped}
</section>

<section>
  <div class="section-head">
    <h2>Evidence pack</h2>
    <p>${pack.totalArtifacts} artifacts across ${result.scores.controlsInScope} applicable controls. GOV-5 requires the record to be produced for NCSC on request.</p>
  </div>
  <p class="muted" style="font-size:.9rem">Evidence references are recorded for ${pack.controlsWithEvidenceRecorded} of ${result.scores.controlsInScope} controls.</p>
</section>

</main>

<footer>
  <div class="wrap">
    <p style="margin:0 0 6px"><b style="color:var(--paper)">Kuwait NBCC Toolkit</b> generated this report from a local assessment file. No data left the machine that produced it.</p>
    <p style="margin:0">
      Source of truth is Annex (1) to ${esc(REGULATION.decision)}, published in ${esc(REGULATION.gazette)} on ${fmtDate(REGULATION.publishedOn)}.
      This report is a readiness aid and is not a determination of compliance by the ${esc(REGULATION.authority)}.
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
