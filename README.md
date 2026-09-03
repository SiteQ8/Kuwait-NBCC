# Kuwait NBCC Toolkit

**National Basic Cybersecurity Controls · NCSC Decision No. 2 of 2026 · الضوابط الوطنية الأساسية للأمن السيبراني**

An open toolkit for the cybersecurity baseline that Kuwait made mandatory in 2026. It holds all 44 controls of Annex (1) as structured data, scores an entity against them, sequences the remaining work against the legal deadline, and produces the evidence pack a regulator can ask for.

**[Open the workbench in your browser](https://siteq8.github.io/Kuwait-NBCC/)** · no install, no account, no upload.

```bash
npx github:SiteQ8/Kuwait-NBCC deadline
npx github:SiteQ8/Kuwait-NBCC init
npx github:SiteQ8/Kuwait-NBCC assess nbcc-assessment.json
```

---

## What the regulation is

On 31 March 2026 the National Cyber Security Center of the State of Kuwait issued **Decision No. 2 of 2026**, published on 5 April 2026 in *Kuwait Al Youm*, issue 1785, year 72. It gives the NBCC legal force under Amiri Decree No. 37 of 2022.

| | |
|---|---|
| Instrument | Decision No. 2 of 2026, Annex (1) |
| Authority | National Cyber Security Center (NCSC) |
| Published | 5 April 2026 |
| Compliance due | **5 October 2027**, being the 18 month window in Article 7 |
| Authoritative text | The English Annex, per Article 6 |
| Aligned with | NIST CSF 2.0 and CIS Controls v8.1 IG1, named in Annex Section 1 |
| Related | Decision No. 35 of 2023 (Governance Framework), Decision No. 1 of 2025 (Data Classification) |

The baseline is a floor, not a ceiling. Article 4 permits a deviation only under a documented exception carrying a risk acceptance and an expiry date, and GOV-5 requires an annual self assessment retained for three years.

## What this toolkit adds

The Annex is prose. Prose cannot be measured, tracked, or handed to an auditor as a position.

So every control here keeps its **official minimum requirement word for word**, and alongside it sits a decomposition into the individual statements an assessor ticks off one at a time. 44 controls become **329 checks** and **164 evidence artifacts**. That decomposition is this project's contribution and carries no official standing, but it is what turns a paragraph of regulation into something you can score, sequence and prove.

**All of it exists in Arabic as well as English.** Every check, every evidence artifact, every control title and purpose. Article 6 makes the English Annex authoritative, so the minimum requirement is quoted rather than translated and stays in English wherever it appears. Everything this project wrote itself follows whichever language you are working in.

| Function | Controls | Checks |
|---|---|---|
| Govern | 6 | 59 |
| Identify | 3 | 33 |
| Protect | 13 | 122 |
| Detect | 2 | 19 |
| Respond | 2 | 25 |
| Recover | 2 | 13 |
| Cloud, Appendix A | 16 | 58 |
| **Total** | **44** | **329** |

Cloud controls fall out of scope automatically for an entity that runs none.

## Two scores, because Article 4 gives you two positions

Most compliance tools report one number. That number cannot answer the question a regulator actually asks.

- **Implementation** is what you have actually built. An exception never raises it.
- **Defensible posture** adds the controls you have not built but have properly excepted, with a written reason, a recorded risk acceptance and an expiry date that has not passed.

A gap between the two is not a failure. It is the part of your position that rests on paper rather than on engineering, and it is exactly the part that expires.

The scorer is deliberately unforgiving about the paper:

- An **expired** exception stops sheltering the control and falls back to a gap, with a high severity finding.
- An exception with **no recorded risk acceptance** shelters nothing.
- A check marked **not applicable without a written justification** raises a high severity finding, because an unexplained exclusion is the easiest way to fake a score.
- An exception **within 90 days of expiry** is surfaced before it lapses.
- A control claimed met at the control level, with no per check answers behind it, still scores, but is recorded as unevidenced.

## The evidence register

Knowing which artifacts a control needs is only half of it. GOV-5 requires the record to be retained for three years and produced for NCSC on request, so the register tracks what is actually held, where it lives, when it was collected, and whether it is still current.

**Freshness follows each control's own cadence** rather than one global expiry, because a weekly discovery review and a biennial policy approval go stale at very different rates. Controls that fire on an event rather than a schedule, such as vetting per hire, never go stale. They only have to exist.

Six states per artifact: `held`, `unreferenced` (you have it but recorded no location, so you cannot produce it), `stale`, `undated` (freshness cannot be judged), `misdated` (collected in the future), and `missing`.

The number that matters most is **claimed but unevidenced**: controls scored met or partial with nothing recorded to show for them. That is the gap an audit finds first, and it is reported separately from the score.

```bash
nbcc evidence entity.json            # the register, with what needs attention
nbcc evidence entity.json --stale    # only what has aged out
nbcc evidence entity.json --missing  # only what has no record
nbcc evidence entity.json --csv      # export it to a spreadsheet
```

In the browser workbench each control carries the same register: tick what you hold, record where it lives and when it was collected, and stale or unlocatable artifacts flag themselves as you go.

## Use it

### In a browser

The [workbench](https://siteq8.github.io/Kuwait-NBCC/) is a single HTML file. Browse the baseline, click through the assessment, read the plan, export your work as JSON. Everything stays in local storage on your machine, which for an entity recording its own control gaps is the point rather than a limitation.

Switch to Arabic and the whole instrument switches with it: right to left layout, translated checks and evidence, translated cadence and effort labels. The quoted requirement stays in English and is direction isolated so its punctuation typesets correctly inside the Arabic page.

### On the command line

```
nbcc <command> [options]

Understand the baseline
  catalog                       List all 44 controls
  show <id> [--ar]              Full detail of one control, e.g. nbcc show PR-2
  search <term>                 Find controls whose text matches a term
  crosswalk [--to csf|cis|iso]  Map the baseline onto other frameworks
  deadline                      Where today sits in the 18 month window

Measure an entity
  init [--out file]             Create a starter assessment file
  assess <file>                 Score an assessment and list gaps
  plan <file>                   Sequenced readiness plan to the deadline
  evidence <file>               Evidence register: what is held, where, how old
  diff <before> <after>         Posture change between two assessments

Produce artifacts
  report <file> --out x.html    Self contained HTML report
  export <file> --as md|csv|json|register
  doctor                        Verify catalog integrity
```

Flags: `--fn <GOV|ID|PR|DE|RS|RC|CLD>`, `--phase <1|2|3>`, `--gaps`, `--json`, `--no-cloud`, `--out <file>`, `--date <YYYY-MM-DD>`, `--ar`.

A worked example ships in `templates/example-assessment.json`:

```
$ nbcc assess templates/example-assessment.json

Bayan Holding Group assessed 2026-09-01

  Implementation      ███████████████░░░░░░░░░░░  58.4%
  Defensible posture  ████████████████░░░░░░░░░░    60%
  Coverage            ███████████████████████░░░  89.7%

  Band Progressing   0 met · 38 partial · 4 gap · 0 unassessed · 1 excepted
```

### As a library

```js
import { CONTROLS, assess, buildPlan, renderReport } from 'kuwait-nbcc';

const result = assess(JSON.parse(readFileSync('nbcc-assessment.json', 'utf8')));
console.log(result.scores.implementation, result.findings.length);
```

## The plan knows what blocks what

Work is not ranked by control number. It is ranked by how much it unblocks, how early its phase falls, how much of it is still open, and how little it costs to start.

Data classification (GOV-3) unblocks seven other controls, so it sorts ahead of the backup rules and the cloud encryption controls that depend on knowing what your data is. The asset inventory (ID-1) sorts ahead of central logging, because you cannot log what you have not enumerated.

Three phases divide the statutory window:

| Phase | Due | Intent |
|---|---|---|
| Establish | 2026-10-05 | Accountability, policy and the inventories everything depends on |
| Engineer | 2027-05-05 | The technical work that needs design, budget and change windows |
| Evidence | 2027-10-05 | Prove the baseline works and assemble the pack |

## Crosswalk

Annex Section 1 aligns the NBCC with **NIST CSF 2.0** and **CIS Controls v8.1 IG1**, and both mappings are reproduced here. An **ISO 27001:2022 Annex A** column is added as a convenience for entities already certified. That third mapping is this project's own reading and is flagged as unofficial everywhere it appears.

```bash
nbcc crosswalk --to cis      # what an existing CIS IG1 programme already earns you
```

## Verified against the gazette

Every official string in the catalog is checked against the published Annex by `scripts/verify-against-gazette.py`, which normalises both sides and compares them character for character. As of 3 September 2026, against Kuwait Al Youm issue 1785:

- **44/44 control titles** match, including the ampersands and parenthetical qualifiers the Annex prints
- **44/44 minimum requirements** match, including the bullet structure inside GOV-6, PR-1.1, PR-6 and DE-1
- **28/28 purposes** match where the Annex prints one

Two cells (PR-2.1 and CLD-7) wrap such that the PDF text layer interleaves adjacent table columns, so they cannot match as a contiguous run. Both were read against the page by hand and the script records them as known artifacts rather than passing them silently.

**Appendix A prints no Purpose column.** Its tables carry only Control ID, Control Title and Minimum Requirement. The purpose text shown for the 16 cloud controls is therefore this project's own summary, is tagged `purposeSource: 'editorial'`, and is marked as a summary everywhere it appears. It must never be quoted as Annex text.

To re-run the check against your own copy of the gazette:

```bash
pip install pypdf
python3 scripts/verify-against-gazette.py path/to/gazette.pdf
```

## Not an official instrument

This is a readiness aid. The authoritative text is the Annex as published in *Kuwait Al Youm* issue 1785, and Article 6 makes the English version controlling. Nothing this tool produces is a determination of compliance by NCSC, and no output should be presented as one. Verify against the gazette before you rely on it.

## Build

Node 18 or newer. No runtime dependencies.

```bash
git clone https://github.com/SiteQ8/Kuwait-NBCC.git
cd Kuwait-NBCC
node --test test/*.test.js     # 85 tests
node scripts/build-site.mjs    # regenerate docs/index.html from the catalog
```

The web workbench is generated from the same catalog the CLI reads, and a test fails if `docs/index.html` falls behind. The page can never disagree with the tool.

## License

MIT. See [LICENSE](LICENSE).

Built by [Ali AlEnezi](https://github.com/SiteQ8).
