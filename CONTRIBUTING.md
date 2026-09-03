# Contributing

## Reporting an error in the catalog

Accuracy against the gazetted text matters more than anything else here. If a control's `requirement` field does not match Annex (1) as published in Kuwait Al Youm issue 1785, open an issue quoting the published wording and the control id. That is the highest value contribution to this project.

## Adding or refining checks

Each control's `checks` array decomposes the official requirement into statements an assessor can answer one at a time. A good check is:

- a single verifiable statement, not a compound one
- written so that "met" is unambiguous
- traceable to specific wording in the requirement, adding nothing the Annex does not ask for
- ended with a full stop, which the test suite enforces

If a check cannot be traced to the requirement text, it does not belong in the catalog.

## Working on the code

```bash
node --test test/*.test.js
node scripts/build-site.mjs
```

The web workbench is generated from the same catalog the CLI reads. After any change under `src/controls/` or to the crosswalk, rebuild the site and commit `docs/index.html`, or the test that compares them will fail.

Keep the project free of runtime dependencies.

## Style

No Unicode dashes anywhere in source or prose. Use plain ASCII hyphens only inside quoted official text, where the gazette's own wording is reproduced for legal accuracy.
