import {getCollection} from 'astro:content';
export async function getPyqYears() {
  const papers = await getCollection('resources', ({data}) => data.status === 'published' && data.type === 'Previous Year Questions (PYQs)');
  const grouped = new Map<number, typeof papers>();
  for (const paper of papers) {
    const match = paper.id.match(/\/pyqs-(\d{4})$/);
    if (!match) throw new Error(`PYQ resource needs a year in its ID: ${paper.id}`);
    const year = Number(match[1]);
    grouped.set(year, [...(grouped.get(year) || []), paper]);
  }
  return [...grouped].sort(([a], [b]) => b-a).map(([year, papers]) => ({year, papers: papers.sort((a,b) => (a.data.course || '').localeCompare(b.data.course || '', undefined, {numeric:true}))}));
}
