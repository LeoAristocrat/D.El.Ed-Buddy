"""Apply reviewed source-to-question mappings; preserve original question evidence.
Run from repository root. Original banks and input are archived privately once.
"""
import json, re, shutil, hashlib
from pathlib import Path
root=Path('site/editorial/qa/answer-replacement-2026-10-06')
source=Path(r'C:\Users\Leo\Desktop\DELED BUDDY Q&A\PYQ-Answers-Output\PYQ-Model-Answers-2021-2026.json')
archive=root/'supplied-answers.json'
if not archive.exists():shutil.copyfile(source,archive)
raw=json.loads(archive.read_text(encoding='utf-8-sig'))
questions={q['id']:q for p in raw['papers'] for q in p['questions']}
assert len(questions)==571
backup=root/'original-banks';backup.mkdir(exist_ok=True)
for f in Path('site/src/data/qa').glob('*.json'):
 if not (backup/f.name).exists():shutil.copyfile(f,backup/f.name)
banks={f.name:json.loads(f.read_text(encoding='utf-8')) for f in backup.glob('*.json')}
targets={q['id']:q for b in banks.values() for u in b['units'] for q in u['pyqs']}
mappings=json.loads((root/'mapping.json').read_text())
choices={};used=set();selections={}
for m in mappings:
 sid=m['sourceId'];q=questions[sid];tid=m['targetId'];assert tid in targets,tid
 text=q['answer'].strip()
 if m['selection']=='excerpt':
  assert text.count(m['start'])==1
  start=text.index(m['start']); end=text.index(m['end'],start) if m.get('end') else len(text)
  text=text[start:end].strip()
 if m['selection'].startswith('label:'):
  label=m['selection'].split(':')[1]
  matches=list(re.finditer(r'^\(([a-z]+)\)\s',text,re.M))
  found=[(i,x) for i,x in enumerate(matches) if x[1]==label]
  assert len(found)==1,(sid,label)
  i,x=found[0];text=text[x.end():matches[i+1].start() if i+1<len(matches) else len(text)].strip()
 assert text and isinstance(q['answer'],str)
 used.add(sid);selections.setdefault(sid,[]).append(m['selection'])
 old=targets[tid]
 rank=(q['marks']==old['marks'],any(str(o['year']) in q['year'] for o in old['occurrences']),m['selection']=='full-answer',int(re.search(r'202[1-6]',q['year'])[0]))
 choices.setdefault(tid,[]).append((rank,m,text))
applied=[]
for tid,candidates in choices.items():
 candidates.sort(key=lambda c:c[0],reverse=True)
 _,m,text=candidates[0];q=targets[tid]
 q['answer']=re.split(r'\n\s*\n',text)
 q['answerFormat']='paragraphs'
 q['answerSource']={'kind':'owner-supplied','id':m['sourceId'],'selection':m['selection']}
 q.pop('tables',None);q.pop('illustration',None)
 applied.append({'targetId':tid,**m,'otherCandidateSourceIds':[c[1]['sourceId'] for c in candidates[1:]]})
for name,b in banks.items():
 if any(q['id'] in choices for u in b['units'] for q in u['pyqs']):
  Path('site/src/data/qa',name).write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
review={'sourceSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'applied':applied,'unmatchedSourceEntries':[q for sid,q in questions.items() if sid not in used],'unchangedExistingQuestions':[{'id':tid,'question':q['question'],'reason':'No safely selected replacement; existing answer retained pending review.'} for tid,q in targets.items() if tid not in choices],'partialSourceEntries':[{'sourceId':sid,'usedSections':parts,'reason':'Only labelled sections with established question matches used; other sections retained in supplied-answers.json.'} for sid,parts in selections.items() if 'full-answer' not in parts]}
(root/'review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Replaced {len(applied)} existing answers from {len(used)} mapped source rows. {len(review["unmatchedSourceEntries"])} source rows and {len(review["unchangedExistingQuestions"])} existing questions held for review.')
