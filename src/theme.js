/*
 * Design tokens shared by the generated report and the web workbench.
 *
 * The palette is drawn from the subject rather than from a template. The base
 * is a deep petrol ink that reads as an official document rather than a
 * dashboard, the primary accent is the green of the Kuwaiti flag deepened for
 * text contrast, and the alert tones are the flag red and a desert ochre. Type
 * is IBM Plex Sans Arabic, which carries Latin and Arabic in one family so a
 * bilingual instrument does not change voice when it changes script, with IBM
 * Plex Mono reserved for control identifiers and figures, which genuinely are
 * codes and quantities rather than decoration.
 */

export const TOKENS = {
  ink: '#10202B',
  inkSoft: '#1D3340',
  paper: '#FBFAF6',
  paperAlt: '#F1EFE8',
  line: '#DAD6CB',
  green: '#056839',
  greenSoft: '#E4EFE7',
  ochre: '#8A6203',
  ochreSoft: '#F7EEDA',
  crimson: '#B3202E',
  crimsonSoft: '#F8E5E6',
  slate: '#5D6E74',
  slateSoft: '#8B9AA0'
};

export const BASE_CSS = `
:root{
  --ink:${TOKENS.ink}; --ink-soft:${TOKENS.inkSoft};
  --paper:${TOKENS.paper}; --paper-alt:${TOKENS.paperAlt};
  --line:${TOKENS.line}; --green:${TOKENS.green}; --green-soft:${TOKENS.greenSoft};
  --ochre:${TOKENS.ochre}; --ochre-soft:${TOKENS.ochreSoft};
  --crimson:${TOKENS.crimson}; --crimson-soft:${TOKENS.crimsonSoft};
  --slate:${TOKENS.slate}; --slate-soft:${TOKENS.slateSoft};
  --sans:"IBM Plex Sans Arabic","IBM Plex Sans","Segoe UI",system-ui,-apple-system,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,"SF Mono",Menlo,monospace;
  --r:6px; --maxw:1180px;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:var(--sans); font-size:16px; line-height:1.6;
  font-feature-settings:"tnum" 0;
}
h1,h2,h3,h4{line-height:1.22; margin:0; font-weight:600; letter-spacing:-0.015em}
h1{font-size:clamp(1.9rem,4.2vw,3rem); font-weight:600}
h2{font-size:clamp(1.3rem,2.4vw,1.7rem)}
h3{font-size:1.05rem}
p{margin:0 0 1em}
a{color:var(--green); text-underline-offset:3px}
a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible,summary:focus-visible{
  outline:2.5px solid var(--green); outline-offset:2px; border-radius:3px;
}
.wrap{max-width:var(--maxw); margin:0 auto; padding:0 24px}
.mono{font-family:var(--mono); font-variant-numeric:tabular-nums}
.num{font-family:var(--mono); font-variant-numeric:tabular-nums; letter-spacing:-0.02em}
.muted{color:var(--slate)}
.cid{
  font-family:var(--mono); font-size:.79rem; font-weight:500; color:var(--slate);
  white-space:nowrap; letter-spacing:-.01em; min-width:5.2rem; display:inline-block;
}
table{border-collapse:collapse; width:100%; font-size:.92rem}
th{text-align:left; font-weight:600; color:var(--slate); padding:9px 12px; border-bottom:1.5px solid var(--line)}
td{padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top}
tbody tr:last-child td{border-bottom:none}
.pill{
  display:inline-block; padding:2px 9px; border-radius:100px;
  font-size:.76rem; font-weight:600; border:1px solid transparent; white-space:nowrap;
}
.pill-met{background:var(--green-soft); color:var(--green); border-color:#BFD9C7}
.pill-partial{background:var(--ochre-soft); color:#8A6508; border-color:#E4D3A6}
.pill-gap{background:var(--crimson-soft); color:var(--crimson); border-color:#EBC4C7}
.pill-exception{background:#E8EEF3; color:#2C5876; border-color:#C3D3DF}
.pill-na,.pill-unassessed,.pill-unknown{background:var(--paper-alt); color:var(--slate); border-color:var(--line)}
.bar{height:7px; background:var(--paper-alt); border-radius:100px; overflow:hidden}
.bar > i{display:block; height:100%; border-radius:100px}
@media(prefers-reduced-motion:no-preference){
  .bar > i{transition:width .5s cubic-bezier(.22,.61,.36,1)}
}
@media print{
  body{background:#fff}
  .no-print{display:none !important}
  section{break-inside:avoid}
}
`;

/*
 * The scale mark used for the compliance window. It is the one piece of
 * ornament in the design and it earns its place, because the eighteen month
 * window of Article 7 is the fact that governs every other decision an entity
 * makes about this baseline.
 */
export function windowScaleSVG(status, opts = {}) {
  const w = opts.width || 900;
  const h = 82;
  const padL = 42;
  const padR = 46;
  const track = w - padL - padR;
  const y = 40;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const pos = clamp(status.elapsedPercent / 100);
  const x = padL + track * pos;

  // A milestone sits at its own share of the window, which is fixed by the
  // Decision rather than by today. elapsedDays + daysRemaining is the milestone
  // measured from publication, whichever side of today it falls on.
  const ticks = status.milestones.map((m) => ({
    ...m,
    x: padL + track * clamp((status.elapsedDays + m.daysRemaining) / status.totalDays)
  }));

  const tickMarkup = ticks
    .map(
      (t) => `
    <line x1="${t.x.toFixed(1)}" y1="${y - 11}" x2="${t.x.toFixed(1)}" y2="${y + 11}" stroke="${TOKENS.line}" stroke-width="1.5"/>
    <text x="${t.x.toFixed(1)}" y="${y + 30}" text-anchor="middle" font-family="var(--sans)" font-size="11.5" fill="${TOKENS.slate}">${opts.lang === 'ar' ? (t.nameAr || t.name) : t.name}</text>
    <text x="${t.x.toFixed(1)}" y="${y - 18}" text-anchor="middle" font-family="var(--mono)" font-size="10.5" fill="${TOKENS.slateSoft}">${t.due}</text>`
    )
    .join('');

  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block" role="img"
  aria-label="Compliance window from ${status.publishedOn} to ${status.deadline}, ${status.elapsedPercent} percent elapsed">
  <line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="${TOKENS.line}" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="${padL}" y1="${y}" x2="${x.toFixed(1)}" y2="${y}" stroke="${TOKENS.green}" stroke-width="3.5" stroke-linecap="round"/>
  ${tickMarkup}
  <line x1="${x.toFixed(1)}" y1="${y - 15}" x2="${x.toFixed(1)}" y2="${y + 15}" stroke="${TOKENS.ink}" stroke-width="2"/>
  <circle cx="${x.toFixed(1)}" cy="${y}" r="3.5" fill="${TOKENS.ink}"/>
</svg>`;
}

const PILLS = {
  met: ['pill-met', 'Met', 'مستوفى'],
  partial: ['pill-partial', 'Partial', 'جزئي'],
  gap: ['pill-gap', 'Gap', 'فجوة'],
  'covered-by-exception': ['pill-exception', 'Exception', 'مغطى باستثناء'],
  unassessed: ['pill-unassessed', 'Not assessed', 'غير مقيم'],
  'not-applicable': ['pill-na', 'Not applicable', 'لا ينطبق'],
  'out-of-scope': ['pill-na', 'Out of scope', 'خارج النطاق'],
  unknown: ['pill-unknown', 'Not assessed', 'غير مقيم'],
  exception: ['pill-exception', 'Exception', 'استثناء'],
  na: ['pill-na', 'Not applicable', 'لا ينطبق']
};

export function statusPill(state, lang = 'en') {
  const [cls, en, ar] = PILLS[state] || ['pill-unknown', state, state];
  return `<span class="pill ${cls}">${lang === 'ar' ? ar : en}</span>`;
}

export function scoreColor(percent) {
  if (percent >= 95) return TOKENS.green;
  if (percent >= 75) return '#2563EB';
  if (percent >= 50) return TOKENS.ochre;
  if (percent >= 25) return '#D2691E';
  return TOKENS.crimson;
}
