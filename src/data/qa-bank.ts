import { z } from 'astro:content';
import courses from './courses.json';

const source = z.object({ label: z.string().min(1), url: z.string().refine(value => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value), 'Use a local path or HTTPS source') });
const answer = z.array(z.string().trim().min(1)).min(1);
const practice = z.tuple([z.number().int().min(1).max(5), z.string().trim().min(1), answer]);
const answerTable = z.object({
  caption: z.string().trim().min(1),
  headers: z.array(z.string().trim().min(1)).min(2),
  rows: z.array(z.array(z.string().trim().min(1))).min(1),
}).refine(table => table.rows.every(row => row.length === table.headers.length), 'Answer table columns must match headers');
const pyq = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  question: z.string().trim().min(1),
  marks: z.number().positive().multipleOf(0.5),
  answer,
  tables: z.array(answerTable).min(1).optional(),
  illustration: z.object({
    src: z.string().regex(/^\/qa-art\/[a-z0-9-]+\.svg$/),
    alt: z.string().trim().min(1),
    caption: z.string().trim().min(1),
  }).optional(),
  status: z.literal('verified'),
  // Every badge needs its own original-paper reference. A compilation claim is insufficient.
  occurrences: z.array(z.object({
    year: z.number().int().min(2021).max(2026),
    page: z.number().int().positive(),
    questionNumber: z.string().trim().min(1),
    paper: z.string().regex(/^\/downloads\/pyqs\/202[1-6]\/s1-[1-9]-202[1-6]\.pdf$/),
    verification: z.literal('visually-checked-original'),
  })).min(1),
});
const schema = z.object({
  course: z.string(),
  units: z.array(z.object({ unit: z.number().int().positive(), sources: z.array(source).min(1), practice: z.array(practice), pyqs: z.array(pyq) })).min(1),
});

export type QaUnit = z.infer<typeof schema>['units'][number];
const files = import.meta.glob('./qa/*.json', { eager: true, import: 'default' });
const banks = new Map<string, z.infer<typeof schema>>();
const allIds = new Set<string>();
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
for (const [file, raw] of Object.entries(files)) {
  const bank = schema.parse(raw);
  const course = courses.find(course => course.id === bank.course);
  if (!course || banks.has(bank.course)) throw new Error(`Unknown or duplicate Q&A course: ${file}`);
  const units = new Set<number>();
  const questions = new Set<string>();
  for (const unit of bank.units) {
    if (!course.units.some(item => item.number === unit.unit) || units.has(unit.unit)) throw new Error(`Invalid Q&A unit: ${file}/${unit.unit}`);
    units.add(unit.unit);
    for (const [marks, expected] of [[1, 10], [2, 10], [3, 10], [4, 5], [5, 5]]) {
      if (unit.practice.filter(item => item[0] === marks).length !== expected) throw new Error(`Q&A quota mismatch: ${file}, unit ${unit.unit}, ${marks} marks`);
    }
    for (const [, question] of unit.practice) {
      const key = normalize(question);
      if (questions.has(key)) throw new Error(`Duplicate Q&A practice question: ${question}`);
      questions.add(key);
    }
    for (const question of unit.pyqs) {
      if (allIds.has(question.id)) throw new Error(`Duplicate Q&A ID: ${question.id}`);
      allIds.add(question.id);
      const occurrences = new Set<string>();
      for (const occurrence of question.occurrences) {
        const expected = `/downloads/pyqs/${occurrence.year}/${bank.course}-${occurrence.year}.pdf`;
        if (occurrence.paper !== expected) throw new Error(`Q&A paper/year mismatch: ${question.id}`);
        const key = `${occurrence.year}/${occurrence.page}/${occurrence.questionNumber}`;
        if (occurrences.has(key)) throw new Error(`Duplicate Q&A occurrence: ${question.id}`);
        occurrences.add(key);
      }
    }
  }
  banks.set(bank.course, bank);
}

export function getQaUnit(course: string, unit: number): QaUnit {
  const entry = banks.get(course)?.units.find(entry => entry.unit === unit);
  if (!entry) throw new Error(`Published Q&A resource has no bank: ${course}/${unit}`);
  return entry;
}
