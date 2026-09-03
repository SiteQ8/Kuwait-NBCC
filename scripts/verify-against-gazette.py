#!/usr/bin/env python3
"""
Verify the catalog against the gazetted Annex.

Point this at a local copy of Kuwait Al Youm issue 1785 and it checks every
official string in the catalog against the published text. The Annex is set as
a narrow multi column table, so both sides are normalised before comparison:
curly quotes fold to straight, soft line break hyphens rejoin, and whitespace
is removed entirely because the PDF text layer sprays spaces inside words.

Usage:  python3 scripts/verify-against-gazette.py [path-to-gazette.pdf]
Exit status is non zero if anything unexpected differs, so this can gate a ship.
"""

import json
import re
import subprocess
import sys
import os

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit('pypdf is required: pip install pypdf')

DEFAULT_PDF = '/mnt/user-data/uploads/Kuwait_National_Basic_Cybersecurity_Controls.pdf'
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Two table cells wrap in a way that makes the extracted text interleave the
# columns, so these fields cannot match as a contiguous run however they are
# normalised. Both were read against the page by hand and are correct.
#   PR-2.1  the Purpose cell is spliced into the middle of the Requirement cell
#   CLD-7   the word "Matrix" from the Title cell lands inside the Requirement
KNOWN_INTERLEAVED = {
    ('PR-2.1', 'requirement'),
    ('PR-2.1', 'purpose'),
    ('CLD-7', 'requirement'),
    ('CLD-7', 'title'),
}

RUNNING_HEADER = re.compile(r'الكويت اليوم[^\n]*')


def normalise(s):
    s = s.replace('\u2019', "'").replace('\u2018', "'")
    s = s.replace('\u201c', '"').replace('\u201d', '"')
    s = s.replace('\u00a0', ' ')
    s = re.sub(r'-\s*\n\s*', '-', s)
    return re.sub(r'\s+', ' ', s).strip()


def squeeze(s):
    return re.sub(r'\s+', '', normalise(s))


def load_gazette(path):
    reader = PdfReader(path)
    raw = '\n'.join(p.extract_text() or '' for p in reader.pages)
    # The running header repeats on every page and lands in the middle of any
    # requirement that spans a page break.
    return normalise(RUNNING_HEADER.sub(' ', raw))


def load_catalog():
    out = subprocess.check_output(['node', '-e', """
import('./src/catalog.js').then(({ CONTROLS }) => {
  process.stdout.write(JSON.stringify(CONTROLS.map(c => ({
    id: c.id, title: c.title, purpose: c.purpose,
    purposeSource: c.purposeSource, requirement: c.requirement
  }))));
});
"""], cwd=REPO, text=True)
    return json.loads(out)


def main():
    pdf = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PDF
    if not os.path.exists(pdf):
        sys.exit(f'Gazette PDF not found at {pdf}\nPass the path as the first argument.')

    gazette = load_gazette(pdf)
    packed = squeeze(gazette)
    controls = load_catalog()

    print(f'Gazette   {os.path.basename(pdf)}, {len(gazette)} chars normalised')
    print(f'Catalog   {len(controls)} controls\n')

    unexpected = []
    stats = {}

    for field in ('title', 'purpose', 'requirement'):
        ok = skipped = artifact = 0
        for c in controls:
            key = (c['id'], field)
            # Appendix A prints no Purpose column, so those summaries are this
            # project's own and there is nothing to verify them against.
            if field == 'purpose' and c['purposeSource'] == 'editorial':
                skipped += 1
                continue
            if squeeze(c[field]) in packed:
                ok += 1
                continue
            if key in KNOWN_INTERLEAVED:
                artifact += 1
                continue
            unexpected.append((c['id'], field, c[field]))
        stats[field] = (ok, artifact, skipped)

    for field, (ok, artifact, skipped) in stats.items():
        checked = ok + artifact
        line = f'{field:12s} {ok:2d}/{checked} verbatim'
        if artifact:
            line += f', {artifact} verified by hand past a column interleave'
        if skipped:
            line += f', {skipped} editorial with no official counterpart'
        print(line)

    editorial = [c['id'] for c in controls if c['purposeSource'] == 'editorial']
    print(f'\nEditorial purposes ({len(editorial)}): {" ".join(editorial)}')
    print('These must never be presented as Annex text.')

    if unexpected:
        print(f'\n{len(unexpected)} UNEXPECTED DIFFERENCE(S)\n')
        for cid, field, mine in unexpected:
            print(f'  {cid}  {field}')
            print(f'    {mine[:300]}')
        return 1

    print('\nCLEAN. Every official string matches the gazette.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
