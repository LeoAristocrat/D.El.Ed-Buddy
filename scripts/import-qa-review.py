"""Import the supplied compilation into a PRIVATE review queue, never published Q&As.

Usage: python site/scripts/import-qa-review.py path/to/compilation.pdf
Requires pypdf. Existing review decisions are preserved by stable item ID.
"""
import hashlib
import json
from pathlib import Path
import re
import sys
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
target = root / 'editorial/qa/review-list.json'
previous = {item['id']: item for item in json.loads(target.read_text(encoding='utf-8'))} if target.exists() else {}
course = marks = None
buffer = []
items = []
start_page = None
for page_no, page in enumerate(PdfReader(sys.argv[1]).pages, 1):
    if page_no <= 2:
        continue
    for raw in (page.extract_text() or '').splitlines():
        line = raw.strip()
        if re.fullmatch(r'S1\.[1-9]', line):
            course = line.lower().replace('.', '-')
            marks = None
            buffer = []
            continue
        heading = re.fullmatch(r'(\d+) Marks? Questions', line)
        if heading:
            if buffer:
                raise ValueError(f'Unterminated candidate on page {page_no}: {buffer}')
            marks = int(heading[1])
            continue
        if not marks or line.startswith('Compiled from the supplied'):
            continue
        if not buffer:
            start_page = page_no
        buffer.append(line)
        ending = re.search(r'((?:202[1-6])(?:,\s*202[1-6])*)$', line)
        if not ending:
            continue
        full = ' '.join(buffer)
        wording = re.sub(r'((?:202[1-6])(?:,\s*202[1-6])*)$', '', full).strip()
        key = hashlib.sha256(f'{course}|{marks}|{wording}|{ending[1]}'.encode()).hexdigest()[:16]
        item_id = f'compiled-{key}'
        flags = []
        if ' / ' in wording or 'Short notes:' in wording:
            flags.append('Possible merged alternatives: check each original question and year.')
        embedded = re.search(r'\[(\d+)\s*M(?:arks?)?\]', wording, re.I)
        if embedded and int(embedded[1]) != marks:
            flags.append('Embedded mark differs from compilation heading.')
        if re.search(r'xx|SNATCH|orem|Gist RBS|schoo!|YogHow', wording, re.I):
            flags.append('Suspected OCR corruption or incomplete wording.')
        items.append(previous.get(item_id, {
            'id': item_id, 'course': course, 'compilationPage': start_page,
            'compilationEndPage': page_no, 'rawQuestion': wording,
            'claimedMarks': marks, 'claimedYears': [int(y) for y in ending[1].split(',')],
            'status': 'pending-original-check', 'unit': None,
            'flags': flags, 'reason': 'Compilation wording, year associations and marks not yet verified against scans.',
            'evidence': [], 'publishedQuestionIds': []
        }))
        buffer = []
if buffer:
    raise ValueError(f'Unterminated final candidate: {buffer}')
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(items)} candidates saved to the private review list. No publication performed.')
