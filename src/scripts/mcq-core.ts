export type Question = {id:string; question:string; options:string[]; answer:number; explanation:string; unit:string; difficulty:string};
export function shuffle<T>(items:readonly T[], random = Math.random):T[] {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) {const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function summarize(questions:Question[], answers:Record<string,number>) {
  const attempted=questions.filter(q=>Number.isInteger(answers[q.id])&&answers[q.id]>=0&&answers[q.id]<4);
  const missed=attempted.filter(q=>answers[q.id]!==q.answer), correct=attempted.length-missed.length;
  return {attempted:attempted.length,correct,incorrect:missed.length,percentage:attempted.length?Math.round(correct/attempted.length*100):0,missed};
}
