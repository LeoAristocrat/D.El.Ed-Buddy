import bank from '../data/dled_first_semester_mcqs.json';
import {safeStore} from './client';
import {shuffle,summarize,type Question} from './mcq-core';
const root=document.querySelector<HTMLElement>('#mcq-bank');
if(root){
 const el=<T extends HTMLElement>(id:string)=>root.querySelector<T>(`#mcq-${id}`)!;
 const subjects:Record<string,{name:string;questions:Question[]}>=bank.subjects;
 const subject=el<HTMLSelectElement>('subject'),unit=el<HTMLSelectElement>('unit'),difficulty=el<HTMLSelectElement>('difficulty');
 const key='buddy-mcq-session';
 let questions:Question[]=[],answers:Record<string,number>={},current=0,code='',complete=false;
 const text=(tag:string,value:string)=>{const n=document.createElement(tag);n.textContent=value;return n;};
 function screen(name:string){for(const id of ['setup','session','results'])el(id).hidden=id!==name;}
 function save(){el('storage').textContent=safeStore.set(key,{version:bank.version,code,ids:questions.map(q=>q.id),answers,current,complete})?'':'Progress could not be saved. You can still finish this quiz.';}
 function restore(){
  const s=safeStore.get(key);
  if(!s||s.version!==bank.version||!Object.hasOwn(subjects,s.code)||!Array.isArray(s.ids)||!s.ids.length||s.ids.length>50||new Set(s.ids).size!==s.ids.length)return false;
  const mapped=s.ids.map((id:string)=>subjects[s.code].questions.find(q=>q.id===id));
  if(mapped.some((q:Question|undefined)=>!q)||!s.answers||typeof s.answers!=='object'||Array.isArray(s.answers)||!Number.isInteger(s.current)||s.current<0||s.current>=mapped.length||typeof s.complete!=='boolean')return false;
  if(Object.entries(s.answers).some(([id,v])=>!s.ids.includes(id)||!Number.isInteger(v)||Number(v)<0||Number(v)>3))return false;
  if(mapped.some((q:Question,i:number)=>(i<s.current&&s.answers[q.id]===undefined)||(i>s.current&&s.answers[q.id]!==undefined)))return false;
  code=s.code;questions=mapped;answers={...s.answers};current=s.current;complete=s.complete;return true;
 }
 function filtered(){return subjects[subject.value].questions.filter(q=>(!unit.value||q.unit===unit.value)&&(!difficulty.value||q.difficulty===difficulty.value));}
 function count(){const n=filtered().length;el('count').textContent=`${n} questions selected`;el<HTMLButtonElement>('start').disabled=n===0;}
 function units(){unit.replaceChildren(new Option('All units',''));[...new Set(subjects[subject.value].questions.map(q=>q.unit))].forEach(v=>unit.add(new Option(v,v)));count();}
 function feedback(q:Question){const n=el('feedback');n.replaceChildren(text('strong',answers[q.id]===q.answer?'Correct ✓':'Incorrect — keep learning'),text('p',`Correct answer: ${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}`),text('p',q.explanation));n.hidden=false;}
 function show(){
  screen('session');const q=questions[current],answered=answers[q.id]!==undefined;
  el('context').textContent=`${code} · ${subjects[code].name} · ${q.unit} · ${q.difficulty}`;
  el('position').textContent=`Question ${current+1}/${questions.length}`;
  const p=el<HTMLProgressElement>('progress');p.max=questions.length;p.value=Object.keys(answers).length;
  el('question').textContent=q.question;const options=el('options');options.replaceChildren();
  q.options.forEach((v,i)=>{const label=document.createElement('label');label.className='mcq-option';const input=document.createElement('input');input.type='radio';input.name='answer';input.value=String(i);input.required=true;input.disabled=answered;input.checked=answers[q.id]===i;input.addEventListener('change',()=>el<HTMLButtonElement>('submit').disabled=false);label.append(input,text('span',`${String.fromCharCode(65+i)}. ${v}`));options.append(label);});
  el('submit').hidden=answered;el<HTMLButtonElement>('submit').disabled=true;el('feedback').hidden=true;el('next').hidden=!answered;el('next').textContent=current===questions.length-1?'See results →':'Next question →';if(answered)feedback(q);el('question').focus();
 }
 function results(){
  complete=true;save();screen('results');const r=summarize(questions,answers);
  el('score').textContent=`Attempted: ${r.attempted}/${questions.length} · Correct: ${r.correct} · Incorrect: ${r.incorrect} · Score: ${r.percentage}% of attempted questions`;
  const missed=el('missed');missed.replaceChildren();r.missed.forEach(q=>{const a=document.createElement('article');a.className='answer-review';a.append(text('h3',q.question),text('p',`Your answer: ${q.options[answers[q.id]]}`),text('p',`Correct answer: ${q.options[q.answer]}`),text('p',q.explanation));missed.append(a);});
  if(!r.missed.length)missed.append(text('p',r.attempted?'No missed questions. Nicely done!':'No answers submitted yet.'));el('result-title').focus();
 }
 const params=new URLSearchParams(location.search),initial=(root.dataset.course||params.get('course')||'').toUpperCase().replace('-','.');
 if(Object.hasOwn(subjects,initial))subject.value=initial;units();const requested=params.get('unit');if([...unit.options].some(o=>o.value===`Unit ${requested}`))unit.value=`Unit ${requested}`;count();el('resume').hidden=!restore();
 subject.addEventListener('change',units);unit.addEventListener('change',count);difficulty.addEventListener('change',count);
 el('setup').addEventListener('submit',e=>{e.preventDefault();const selected=filtered();if(!selected.length)return;code=subject.value;questions=shuffle(selected);answers={};current=0;complete=false;save();show();});
 el('resume').addEventListener('click',()=>{if(restore()){if(complete)results();else show();}});
 el('answer-form').addEventListener('submit',e=>{e.preventDefault();const q=questions[current];if(answers[q.id]!==undefined)return;const v=new FormData(el<HTMLFormElement>('answer-form')).get('answer');if(v===null)return;answers[q.id]=Number(v);save();show();el('next').focus();});
 el('next').addEventListener('click',()=>{if(answers[questions[current].id]===undefined)return;if(current===questions.length-1){results();return;}current++;save();show();});
 el('finish').addEventListener('click',results);
 function setup(){screen('setup');el('resume').hidden=!restore();subject.focus();}
 el('back').addEventListener('click',setup);el('retry').addEventListener('click',setup);
}
