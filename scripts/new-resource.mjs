import fs from 'node:fs';import path from 'node:path';
const [slug,course='s1-1',unit='1',type='Notes']=process.argv.slice(2);
if(!slug||!/^[-a-z0-9]+$/.test(slug)){console.error('Usage: npm run new-resource -- growth-and-development s1-1 1 "Notes"');process.exit(1)}
const courses=JSON.parse(fs.readFileSync('src/data/courses.json','utf8'));const c=courses.find(c=>c.id===course);if(!c?.units.some(u=>u.number===Number(unit)))throw Error('Unknown course or unit');
const types=['Study Notes','Detailed Notes','Notes','Revision','Infographics','PDFs','Important Questions','MCQs','Quizzes','Reference'];if(!types.includes(type))throw Error('Unknown resource type');
const dir=path.join('content/resources',course);fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,slug+'.md');if(fs.existsSync(file))throw Error('Resource already exists; choose another slug.');
const today=new Date().toISOString().slice(0,10);const quote=JSON.stringify;
fs.writeFileSync(file,`---\ntitle: ${quote(slug.replaceAll('-',' '))}\ndescription: "Write a short, useful description."\ntype: ${quote(type)}\ncourse: ${quote(course)}\nunit: ${Number(unit)}\nsemester: 1\nsyllabusVersion: "2024"\nauthor: "Sayeem Sadik"\norigin: "Leo’s Notes"\nstatus: "draft"\nsource: "Add the exact source and page references."\nupdatedDate: "${today}"\ndifficulty: "Core"\n---\n\n## Start here\n\nWrite your notes in your own words. Add references. Keep this as a draft until checked.\n`);
console.log('Created '+file+' (draft, not publicly visible).');
