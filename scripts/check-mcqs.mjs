import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shuffle,summarize} from '../src/scripts/mcq-core.ts';
const bank=JSON.parse(fs.readFileSync(new URL('../src/data/dled_first_semester_mcqs.json',import.meta.url),'utf8'));
assert.equal(Object.keys(bank.subjects).length,9);
const ids=new Set();
for(const s of Object.values(bank.subjects)){
 assert.equal(s.questions.length,50); assert.equal(s.questionCount,50);
 for(const q of s.questions){assert.equal(q.options.length,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert.equal(q.options[q.answer],q.correctAnswer);assert.equal(q.answerLetter,'ABCD'[q.answer]);assert.ok(!ids.has(q.id));ids.add(q.id);}
 const shuffled=shuffle(s.questions,()=>0);assert.equal(new Set(shuffled.map(q=>q.id)).size,50);assert.notDeepEqual(shuffled.map(q=>q.id),s.questions.map(q=>q.id));
 for(const q of shuffled)assert.equal(q.options[q.answer],q.correctAnswer);
 const answers=Object.fromEntries(shuffled.map(q=>[q.id,q.answer]));assert.equal(summarize(s.questions,answers).percentage,100);
 answers[shuffled[0].id]=(shuffled[0].answer+1)%4;
 const result=summarize(s.questions,answers);assert.equal(result.correct,49);assert.equal(result.incorrect,1);assert.equal(result.percentage,98);assert.equal(result.missed[0].id,shuffled[0].id);
 const partial=summarize(s.questions,{[shuffled[0].id]:shuffled[0].answer});assert.equal(partial.attempted,1);assert.equal(partial.percentage,100);assert.equal(summarize(s.questions,{}).percentage,0);
}
console.log('PASS: 450 unique questions, 9 subjects, mappings, shuffle and scoring.');
