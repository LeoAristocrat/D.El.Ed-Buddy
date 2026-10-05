import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(site, file), 'utf8'));
const courses = read('src/data/courses.json');
const review = read('editorial/qa/review-list.json');
const normalize = text => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const published = new Map();
const occurrenceKeys = new Set();
const totals = { units: 0, practice: 0, pyqs: 0, occurrences: 0 };
for (const file of fs.readdirSync(path.join(site, 'src/data/qa')).filter(file => file.endsWith('.json'))) {
  const bank = read(`src/data/qa/${file}`);
  const course = courses.find(course => course.id === bank.course);
  assert(course, `Unknown course ${bank.course}`);
  const seenUnits = new Set();
  const practiceQuestions = new Set();
  const pyqQuestions = new Set(bank.units.flatMap(unit => unit.pyqs.map(question => normalize(question.question))));
  for (const unit of bank.units) {
    assert(course.units.some(item => item.number === unit.unit), 'Unknown unit');
    assert(!seenUnits.has(unit.unit), 'Duplicate unit');
    seenUnits.add(unit.unit);
    assert.equal(unit.practice.length, 40, `${bank.course}/${unit.unit}: practice quota`);
    for (const [marks, count] of [[1,10],[2,10],[3,10],[4,5],[5,5]]) assert.equal(unit.practice.filter(q => q[0] === marks).length, count);
    const resource = path.join(site, `content/resources/${bank.course}/unit-${unit.unit}-qa.md`);
    assert(fs.existsSync(resource), `Missing resource ${resource}`);
    for (const [marks, question, answer] of unit.practice) {
      const key = normalize(question);
      assert(!practiceQuestions.has(key), `Duplicate practice: ${question}`);
      assert(!pyqQuestions.has(key), `PYQ counted as new practice: ${question}`);
      practiceQuestions.add(key);
      assert(answer.length && answer.every(point => typeof point === 'string' && point.trim()), 'Empty answer');
      assert(marks >= 1 && marks <= 5);
    }
    for (const q of unit.pyqs) {
      assert.equal(q.status, 'verified');
      assert(q.answer.length && q.answer.every(point => point.trim()), 'Empty PYQ answer');
      for (const table of q.tables ?? []) {
        assert(table.caption.trim() && table.headers.length >= 2 && table.rows.length, 'Empty answer table');
        assert(table.headers.every(header => header.trim()), 'Empty table header');
        assert(table.rows.every(row => row.length === table.headers.length && row.every(cell => cell.trim())), 'Invalid answer table row');
      }
      if (q.illustration) {
        assert(/^\/qa-art\/[a-z0-9-]+\.svg$/.test(q.illustration.src), 'Invalid illustration path');
        assert(q.illustration.alt.trim() && q.illustration.caption.trim(), 'Missing illustration description');
        assert(fs.existsSync(path.join(site, 'public', q.illustration.src.slice(1))), 'Missing model illustration');
      }
      assert(q.marks > 0 && Number.isInteger(q.marks * 2), 'Invalid original marks');
      assert(!published.has(q.id), `Duplicate ID: ${q.id}`);
      published.set(q.id, { ...q, course: bank.course, unit: unit.unit });
      assert(q.occurrences.length, 'No original evidence');
      for (const source of q.occurrences) {
        assert.equal(source.verification, 'visually-checked-original');
        assert.equal(source.paper, `/downloads/pyqs/${source.year}/${bank.course}-${source.year}.pdf`);
        assert(Number.isInteger(source.page) && source.page > 0);
        assert(source.questionNumber.trim());
        assert(fs.existsSync(path.join(site, 'public', source.paper.slice(1))), `Missing paper: ${source.paper}`);
        const key = `${bank.course}/${source.year}/${source.questionNumber}`;
        assert(!occurrenceKeys.has(key), `Original question counted twice: ${key}`);
        occurrenceKeys.add(key);
        totals.occurrences++;
      }
    }
    totals.units++; totals.practice += unit.practice.length; totals.pyqs += unit.pyqs.length;
  }
}
// Independent inventory from visual inspection: includes every option, not just required attempts.
const expected = {
  2021: ['1(a)','1(b)','1(c)','1(d)','2','3','4','5','6(a)','6(b)','6(c)'],
  2022: ['1(a)','1(b)','1(c)','1(d)','2','3','4','5','6(a)','6(b)','6(c)'],
  2023: ['1(a)','1(b)','1(c)','1(d)','2','3','4','5','6(a)','6(b)','6(c)'],
  2024: ['1(a)','1(b)','1(c)','2','3','4','5(a)','6','7'],
  2025: ['1(a)','1(b)','1(c)','1(d)','2','3','4','4 (alternative)','5','6','7(a)','7(b)','7(c)'],
};
for (const [year, numbers] of Object.entries(expected)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-9/${year}/`));
  assert.equal(actual.length, numbers.length, `S1.9 ${year} inventory mismatch`);
  for (const number of numbers) assert(occurrenceKeys.has(`s1-9/${year}/${number}`), `Missing S1.9 ${year} Q${number}`);
}
const fractions = [...published.values()].filter(q => q.course === 's1-9' && q.marks === 1.5);
const englishInventory = read('editorial/qa/s1-5-inventory.json');
const ecceInventory = read('editorial/qa/s1-2-inventory.json');
const languageInventory = read('editorial/qa/s1-3-inventory.json');
const mathInventory = read('editorial/qa/s1-6-inventory.json');
const yogaInventory = read('editorial/qa/s1-8-inventory.json');
const childInventory = read('editorial/qa/s1-1-inventory.json');
for (const [year, inventory] of Object.entries(childInventory.years)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-1/${year}/`));
  assert.equal(actual.length, inventory.published.length, `S1.1 ${year} inventory mismatch`);
  for (const number of inventory.published) assert(occurrenceKeys.has(`s1-1/${year}/${number}`), `Missing S1.1 ${year} Q${number}`);
  for (const number of inventory.review) assert(!occurrenceKeys.has(`s1-1/${year}/${number}`), `Unresolved S1.1 question published: ${year}/${number}`);
}
for (const [year, inventory] of Object.entries(yogaInventory.years)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-8/${year}/`));
  assert.equal(actual.length, inventory.published.length, `S1.8 ${year} inventory mismatch`);
  for (const number of inventory.published) assert(occurrenceKeys.has(`s1-8/${year}/${number}`), `Missing S1.8 ${year} Q${number}`);
  for (const number of inventory.review) assert(!occurrenceKeys.has(`s1-8/${year}/${number}`), `Unresolved S1.8 question published: ${year}/${number}`);
}
for (const [year, inventory] of Object.entries(mathInventory.years)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-6/${year}/`));
  assert.equal(actual.length, inventory.published.length, `S1.6 ${year} inventory mismatch`);
  for (const number of inventory.published) assert(occurrenceKeys.has(`s1-6/${year}/${number}`), `Missing S1.6 ${year} Q${number}`);
  for (const number of inventory.review) assert(!occurrenceKeys.has(`s1-6/${year}/${number}`), `Unresolved S1.6 question published: ${year}/${number}`);
}
for (const [year, inventory] of Object.entries(languageInventory.years)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-3/${year}/`));
  assert.equal(actual.length, inventory.published.length, `S1.3 ${year} inventory mismatch`);
  for (const number of inventory.published) assert(occurrenceKeys.has(`s1-3/${year}/${number}`), `Missing S1.3 ${year} Q${number}`);
  for (const number of inventory.review) assert(!occurrenceKeys.has(`s1-3/${year}/${number}`), `Unresolved S1.3 question published: ${year}/${number}`);
}
for (const [year, inventory] of Object.entries(ecceInventory.years)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-2/${year}/`));
  assert.equal(actual.length, inventory.published.length, `S1.2 ${year} inventory mismatch`);
  for (const number of inventory.published) assert(occurrenceKeys.has(`s1-2/${year}/${number}`), `Missing S1.2 ${year} Q${number}`);
  for (const number of inventory.review ?? []) assert(!occurrenceKeys.has(`s1-2/${year}/${number}`), `Unresolved S1.2 question published: ${year}/${number}`);
}
for (const [year, inventory] of Object.entries(englishInventory.years)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-5/${year}/`));
  assert.equal(actual.length, inventory.published.length, `S1.5 ${year} inventory mismatch`);
  for (const number of inventory.published) assert(occurrenceKeys.has(`s1-5/${year}/${number}`), `Missing S1.5 ${year} Q${number}`);
  for (const number of inventory.review ?? []) assert(!occurrenceKeys.has(`s1-5/${year}/${number}`), `Unresolved S1.5 question published: ${year}/${number}`);
}
const artInventory = read('editorial/qa/s1-7-inventory.json');
for (const [year, inventory] of Object.entries(artInventory.years)) {
  const actual = [...occurrenceKeys].filter(key => key.startsWith(`s1-7/${year}/`));
  assert.equal(actual.length, inventory.published.length, `S1.7 ${year} inventory mismatch`);
  for (const number of inventory.published) assert(occurrenceKeys.has(`s1-7/${year}/${number}`), `Missing S1.7 ${year} Q${number}`);
  for (const number of inventory.review) assert(!occurrenceKeys.has(`s1-7/${year}/${number}`), `Unresolved S1.7 question published: ${year}/${number}`);
}
assert.equal(fractions.length, 3, 'Original half marks must be retained');
assert.equal(totals.units, 37, 'Every syllabus unit must have a Q&A reader');
assert.equal(totals.practice, 1480, 'All 1,480 additional practice questions are required');
assert(!review.some(item => item.status === 'pending-original-check'), 'Original-paper reconciliation is incomplete');
for (const item of review) {
  if (item.status === 'resolved-from-original') {
    assert(item.publishedQuestionIds.length && item.evidence.length, `No resolution evidence: ${item.id}`);
    for (const id of item.publishedQuestionIds) assert(published.has(id), `Broken review mapping: ${id}`);
  } else {
    assert.equal(item.publishedQuestionIds.length, 0, `Unresolved item linked as published: ${item.id}`);
  }
}
console.log(JSON.stringify({ ...totals, targetUnits: 37, targetPractice: 1480, pendingUnits: 37 - totals.units, reviewCandidates: review.length, resolvedCandidates: review.filter(q => q.status === 'resolved-from-original').length }, null, 2));
console.log('PASS: quotas, exact duplicates, original-paper coverage, fractional marks, provenance and review isolation. Editorial fact-checking remains a separate requirement.');
