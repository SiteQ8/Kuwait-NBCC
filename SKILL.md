---
name: kuwait-nbcc
description: Assess, plan and evidence compliance with the Kuwait National Basic Cybersecurity Controls, Annex (1) to NCSC Decision No. 2 of 2026. Use when a user asks about Kuwait cybersecurity regulation, NBCC, NCSC Decision No. 2 of 2026, the October 2027 compliance deadline, or wants to score an entity against the 44 controls.
---

# Kuwait NBCC Toolkit

Structured access to Kuwait's mandatory cybersecurity baseline: 44 controls, 329 checks, 164 evidence artifacts, in Arabic and English, with crosswalks to NIST CSF 2.0, CIS Controls v8.1 IG1 and ISO 27001:2022.

Everything exists in both languages, including a working Arabic translation of all 44 minimum requirements. Article 6 makes the English Annex authoritative, so the Arabic requirement is labelled a working translation and the official English is always printed alongside it. Never quote the Arabic requirement as the regulation.

## When to use this

- A user asks what the Kuwait NBCC requires, or what a specific control says.
- A user wants to know how ready an entity is, or what to do first.
- A user asks how much time remains before the statutory deadline.
- A user already holds ISO 27001 or runs CIS IG1 and wants to know what that earns them.

## Install

```bash
npx github:SiteQ8/Kuwait-NBCC <command>
```

No runtime dependencies. Node 18 or newer.

## The regulation in one paragraph

Decision No. 2 of 2026 of the National Cyber Security Center, published 5 April 2026 in Kuwait Al Youm issue 1785, makes the NBCC binding on entities under NCSC mandate. Article 7 sets an 18 month window, so full compliance is due **5 October 2027**. Article 6 makes the English Annex authoritative. Article 4 permits deviation only under a documented exception carrying a risk acceptance and an expiry date. GOV-5 requires an annual self assessment retained three years.

## Commands

| Task | Command |
|---|---|
| List every control | `nbcc catalog` |
| Read one control in full | `nbcc show PR-2` |
| Anything in Arabic | add `--ar` to any command |
| Find controls by text | `nbcc search MFA` |
| Map onto another framework | `nbcc crosswalk --to cis` |
| Time remaining | `nbcc deadline` |
| Start an assessment | `nbcc init --out entity.json` |
| Score it | `nbcc assess entity.json` |
| Sequence the work | `nbcc plan entity.json` |
| Evidence register | `nbcc evidence entity.json` |
| Starter policy or register | `nbcc draft incident-response --out ir.md` |
| Only what has gone stale | `nbcc evidence entity.json --stale` |
| HTML report | `nbcc report entity.json --out report.html` |
| Arabic HTML report | `nbcc report entity.json --out report.html --ar` |
| Compare two points in time | `nbcc diff q1.json q3.json` |
| Will we make the deadline | `nbcc trend snapshots/*.json` |
| Roll several entities up | `nbcc portfolio entities/*.json` |

Add `--json` to any read command for machine readable output. Add `--no-cloud` to `init` for an entity that runs no cloud, which drops the 16 Appendix A controls from scope.

## Control identifiers

`GOV-1` to `GOV-6`, `ID-1` to `ID-3`, `PR-1` through `PR-6` with subcontrols `PR-1.1`, `PR-1.2`, `PR-2.1`, `PR-2.2`, `PR-3.1`, `PR-4.1`, `PR-4.2`, then `DE-1`, `DE-2`, `RS-1`, `RS-2`, `RC-1`, `RC-2`, and `CLD-1` to `CLD-16`.

## Reading a score

Two headline numbers, and the gap between them matters.

- **Implementation** is what the entity has actually built. An exception never raises it.
- **Defensible posture** adds properly excepted controls, meaning a written reason, a recorded risk acceptance, and an unexpired date.

When posture exceeds implementation, the difference is the part of the position that rests on paper and will expire. Report both, and say which findings are high severity. An expired exception, or a not applicable claim with no written justification, are the two failures most likely to collapse under audit.

## Assessment file shape

```json
{
  "nbcc": "1",
  "entity": { "name": "Entity", "sector": "Financial services" },
  "assessmentDate": "2026-09-01",
  "profile": { "usesCloud": true, "hasPublicAccounts": true },
  "controls": {
    "GOV-1": {
      "owner": "CISO",
      "checks": ["met", "met", "partial", "gap"],
      "notes": "Appointment letter signed, role matrix pending.",
      "targetDate": "2026-11-30"
    },
    "PR-4.2": {
      "checks": ["exception"],
      "exception": {
        "reason": "Air gapped laboratory transfer.",
        "riskAccepted": true,
        "expiry": "2027-06-30"
      }
    }
  }
}
```

Check statuses: `met`, `partial`, `gap`, `exception`, `na`, `unknown`. A control level `"status"` fills in checks nobody answered but never overrides one that was answered.

## Reading the evidence register

The register tracks what the entity actually holds, not just what it needs. Freshness follows each control's own cadence, so evidence for a weekly control ages out in 45 days while a biennial one has 790. Event driven controls never go stale.

Report the **claimed but unevidenced** count alongside the score. Controls scored met or partial with nothing recorded to show for them are the gap an audit finds first, and a high implementation percentage with a low producible percentage is a weaker position than it looks.

## Reading a forecast

`trend` needs at least two snapshots on different dates. It reports a verdict of on track, close, behind, stalled or regressing, and when behind it gives both the current rate and the rate required, so the gap is expressed as a multiple of present pace.

Treat it as a direction rather than a date. It fits a straight line, and compliance work rarely moves in one. Two qualifiers matter when reporting it: whether the recent pace diverges from the average, which the tool flags, and the separate evidence projection, since implementation can be on track while the ability to prove it is not.

## Reading a portfolio

`portfolio` takes several entities, not one entity over time. The distinction it draws is systemic versus isolated: a control failing at 60% or more of the entities it applies to is a group problem with a group fix, while the rest are individual. Report the systemic list first, because scheduling those once instead of n times is where the time is saved.

Scope is respected, so an entity running no cloud shrinks the denominator on Appendix A rather than registering sixteen failures.

## Checks that go beyond the Annex

Nine checks ask for more than the requirement states and are marked `beyond the Annex` in every output. When reporting a gap on one of them, say so: the entity is not failing the regulation, it is failing a practice this toolkit recommends. The nine sit in GOV-1, CLD-1, CLD-2, CLD-4, CLD-5, CLD-6, CLD-9, CLD-13 and CLD-14.

## Cautions

Do not present any output as a determination of compliance by NCSC. The authoritative text is the gazetted Annex. The decomposition of each requirement into checks is this toolkit's own work and carries no official standing, and the ISO 27001 crosswalk is a convenience mapping, unlike the NIST CSF and CIS mappings which the Annex itself names.

Appendix A prints no Purpose column, so the purpose shown for the 16 cloud controls is this toolkit's own summary rather than regulation text. It is tagged `purposeSource: "editorial"` and marked as a summary in every output. Never quote it as the Annex.
