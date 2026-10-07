import assert from 'node:assert/strict';
import {guidance,parseAttendance,totals,validDate,validTotals} from '../src/scripts/attendance-model.ts';
assert.match(guidance(6,10,75),/next 6 days/);
assert.match(guidance(9,10,75),/miss 2 more/);
assert.match(guidance(9,10,100),/no longer reachable/);
assert(!validDate('2026-02-30'));assert(validDate('2024-02-29'));assert(!validTotals(4,3));
const s={version:2,target:75,attended:6,held:10,days:{'2026-10-01':'present'}};
assert.deepEqual(totals(parseAttendance(JSON.stringify(s))),{attended:7,held:11});
s.days['2026-10-01']='absent';assert.deepEqual(totals(s),{attended:6,held:11});
assert.throws(()=>parseAttendance(JSON.stringify({...s,days:{'bad':'present'}})));
assert.throws(()=>parseAttendance(JSON.stringify({...s,days:{'2026-10-01':'holiday'}})));
for(let t=1;t<=100;t++)for(let h=1;h<=50;h++)for(let a=0;a<=h;a++){
 const g=guidance(a,h,t);const n=Number(g.match(/(?:next|miss) (\d+)/)?.[1]);
 if(100*a<t*h&&t<100){assert(100*(a+n)>=t*(h+n));assert(100*(a+n-1)<t*(h+n-1));}
 if(100*a>=t*h&&Number.isFinite(n)){assert(100*a>=t*(h+n));assert(100*a<t*(h+n+1));}
}
console.log('PASS: daily totals, dates, duplicate-day replacement, validation and targets.');
