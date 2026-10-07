export type Attendance = {version:2; target:number; attended:number; held:number; days:Record<string,'present'|'absent'>};
export const validTotals=(a:number,h:number)=>Number.isSafeInteger(a)&&Number.isSafeInteger(h)&&a>=0&&h>=a&&h<=1000000;
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function parseAttendance(raw:string):Attendance{
 const v=JSON.parse(raw);
 if(v?.version!==2||!Number.isInteger(v.target)||v.target<1||v.target>100||!validTotals(v.attended,v.held)||!v.days||typeof v.days!=='object'||Array.isArray(v.days)||Object.keys(v.days).length>100000)throw Error('Invalid saved attendance');
 for(const [date,status] of Object.entries(v.days))if(!validDate(date)||!['present','absent'].includes(status as string))throw Error('Invalid day');
 return v;
}
export function totals(s:Attendance){return {attended:s.attended+Object.values(s.days).filter(v=>v==='present').length,held:s.held+Object.keys(s.days).length};}
export function guidance(attended: number, held: number, target: number) {
  if (!held) return 'Mark your first day to see your progress.';
  if (100 * attended < target * held) {
    if (target === 100) return 'Past absences mean 100% is no longer reachable in this record.';
    const needed = Math.ceil((target * held - 100 * attended) / (100 - target));
    return `Attend the next ${needed} ${needed === 1 ? 'day' : 'days'} to reach ${target}%.`;
  }
  const spare = Math.floor((100 * attended - target * held) / target);
  return spare ? `You could miss ${spare} more ${spare === 1 ? 'day' : 'days'} and stay at or above ${target}%.` : `You’re meeting ${target}%. Attend the next day to stay on track.`;
}
