import {guidance,parseAttendance,validTotals,validDate,totals,type Attendance} from './attendance-model';
const app=document.querySelector<HTMLElement>('#attendance-app');
if(app){
 const key='deled-buddy-attendance-v2';
 let state:Attendance={version:2,target:75,attended:0,held:0,days:{}};
 let previous:Attendance|undefined;let saveEnabled=true;
 const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
 const status=el('attendance-status'),storage=el('attendance-storage');
 const target=el<HTMLFormElement>('attendance-target'),opening=el<HTMLFormElement>('attendance-opening');
 const field=(form:HTMLFormElement,name:string)=>form.elements.namedItem(name) as HTMLInputElement;
 const date=el<HTMLInputElement>('attendance-date'),undo=el<HTMLButtonElement>('attendance-undo');
 const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 date.value=today;date.max=today;
 try{const raw=localStorage.getItem(key);if(raw)state=parseAttendance(raw);else if(localStorage.getItem('deled-buddy-attendance-v1'))status.textContent='The tracker now counts days. Enter your previous daily totals below; older records have not been combined or deleted.';}
 catch{saveEnabled=false;storage.textContent='Saved records could not be loaded. This session will not overwrite them or save changes.';}
 function save(){if(!saveEnabled)return;try{localStorage.setItem(key,JSON.stringify(state));storage.textContent='';}catch{storage.textContent='Your browser could not save these changes. They may be lost on refresh.';}}
 function renderDay(){el('attendance-day-status').textContent=state.days[date.value]?`Recorded: ${state.days[date.value]}.`:'Not recorded.';el<HTMLButtonElement>('attendance-clear').disabled=!state.days[date.value];}
 function render(){
  const {attended,held}=totals(state);
  el('attendance-percent').textContent=held?`${(100*attended/held).toFixed(2)}%`:'—';
  el('attendance-totals').textContent=`${attended} days present · ${held-attended} days absent · ${held} working days`;
  el<HTMLProgressElement>('attendance-progress').value=held?100*attended/held:0;
  el('attendance-guidance').textContent=guidance(attended,held,state.target);
  field(target,'target').value=String(state.target);field(opening,'attended').value=String(state.attended);field(opening,'held').value=String(state.held);
  undo.disabled=!previous;renderDay();
  const history=el('attendance-history');history.replaceChildren();
  for(const [day,value] of Object.entries(state.days).sort(([a],[b])=>b.localeCompare(a))){const li=document.createElement('li');li.textContent=`${day} · ${value}`;history.append(li);}
  el('attendance-empty').hidden=Object.keys(state.days).length>0;
 }
 function commit(change:()=>void,message:string){previous=structuredClone(state);change();save();render();status.textContent=message;}
 function checkDate(){if(!validDate(date.value)||date.value>today){status.textContent='Choose a valid date, today or earlier.';return false;}return true;}
 for(const value of ['present','absent'] as const)el(`attendance-${value}`).addEventListener('click',()=>{
  if(!checkDate())return;
  if(state.days[date.value]===value){status.textContent='This day is already marked that way.';return;}
  if(!state.days[date.value]&&Object.keys(state.days).length>=100000){status.textContent='The record limit has been reached.';return;}
  commit(()=>{state.days[date.value]=value;},`${date.value}: marked ${value}.`);
 });
 el('attendance-clear').addEventListener('click',()=>{if(checkDate()&&state.days[date.value])commit(()=>{delete state.days[date.value];},'Day cleared. It no longer counts towards attendance.');});
 date.addEventListener('input',renderDay);
 target.addEventListener('submit',e=>{e.preventDefault();const n=field(target,'target').valueAsNumber;if(Number.isInteger(n)&&n>=1&&n<=100)commit(()=>{state.target=n;},`Target updated to ${n}%.`);});
 opening.addEventListener('submit',e=>{e.preventDefault();const a=field(opening,'attended').valueAsNumber,h=field(opening,'held').valueAsNumber;if(!validTotals(a,h)){status.textContent='Use whole-number totals. Days attended cannot exceed working days.';return;}commit(()=>{state.attended=a;state.held=h;},'Previous attendance updated.');});
 undo.addEventListener('click',()=>{if(!previous)return;state=previous;previous=undefined;save();render();status.textContent='Last change undone.';el('attendance-present').focus();});
 render();app.hidden=false;
}
