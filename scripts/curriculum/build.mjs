// Build-only authoring parser: structured blocks, never raw HTML.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { outline } from './outline.mjs';
import { additions, revisions } from './assessments.mjs';
import { appliedQuestions } from './applied.mjs';
import { validateProgression, withScaffoldImports } from './progression.mjs';
const directory=new URL('./',import.meta.url);
const baseline=JSON.parse(readFileSync(new URL('base-lessons.json',directory),'utf8'));
const bank=new Map([...baseline,...additions].map(l=>[l.id,l]));
export function parseTheory(markdown){
  const sections=[];let section,paragraph=[],items=[];
  const flush=()=>{
    if(paragraph.length){section.blocks.push({type:'paragraph',text:paragraph.join(' ')});paragraph=[];}
    if(items.length){section.blocks.push({type:'list',items});items=[];}
  };
  const lines=markdown.replace(/\r/g,'').split('\n');
  for(let i=0;i<lines.length;i++){
    const line=lines[i];if(line.startsWith('# '))continue;
    if(line.startsWith('## ')){
      if(section)flush();section={id:`section-${sections.length+1}`,title:line.slice(3),blocks:[]};sections.push(section);continue;
    }
    if(!section){if(line.trim())throw new Error('Theory needs an H2 heading');continue;}
    if(line.startsWith('```')){
      flush();const language=line.slice(3).trim()||'javascript',code=[];
      while(++i<lines.length&&lines[i]!=='```')code.push(lines[i]);
      if(i===lines.length)throw new Error('Unclosed code block');
      section.blocks.push({type:language==='output'?'output':'code',text:code.join('\n'),language});continue;
    }
    if(!line.trim()){flush();continue;}
    if(line.startsWith('- ')){if(paragraph.length)flush();items.push(line.slice(2));continue;}
    if(items.length)flush();paragraph.push(line);
  }
  if(section)flush();return sections;
}
// Preview keeps the previously published chapters while long-form authoring
// is in progress. Normal builds always require the complete authored outline.
const preview=process.argv.includes('--preview');
const target=new URL('../../backend/src/catalog/data/',import.meta.url);
const priorLessons=preview?JSON.parse(readFileSync(new URL('lessons.json',target),'utf8')):[];
const entries=preview?outline.filter(entry=>existsSync(new URL(`theory/${entry.id}.md`,directory))||priorLessons.some(l=>l.id===entry.id)):outline;
const lessons=entries.map((entry,index)=>{
  if(preview&&!existsSync(new URL(`theory/${entry.id}.md`,directory)))return {...priorLessons.find(l=>l.id===entry.id),module:entry.module};
  const authored=bank.get(entry.id);if(!authored)throw new Error(`Missing assessment ${entry.id}`);
  const metadata={...authored,...revisions[entry.id]};
  const sections=parseTheory(readFileSync(new URL(`theory/${entry.id}.md`,directory),'utf8'));
  const words=sections.flatMap(s=>s.blocks).filter(b=>['paragraph','list'].includes(b.type)).map(b=>b.text??b.items.join(' ')).join(' ').split(/\s+/).length;
  const examples=sections.flatMap(s=>s.blocks).filter(b=>b.type==='code').length;
  if(sections.length<6||words<450||examples<3)throw new Error(`Incomplete ${entry.id}: ${sections.length} sections, ${words} words, ${examples} examples`);
  const exercise={...metadata.exercise,id:entry.id,title:entry.title,language:['typescript','nest'].includes(entry.trackId)?'typescript':'javascript'};
  exercise.starterCode=withScaffoldImports(exercise);
  const questions=[...metadata.questions,...appliedQuestions(entry.id,sections.length)];
  if(questions.length!==5)throw new Error(`Expected 3 conceptual and 2 applied questions: ${entry.id}`);
  const readingMinutes=Math.ceil(words/140)+examples;
  const previous=entries.slice(0,index).filter(x=>x.trackId===entry.trackId).at(-1);
  const entryDependencies={typescript:['javascript-testing'],express:['javascript-testing'],nest:['typescript-modules','express-testing']};
  const prerequisites=previous?[previous]: (entryDependencies[entry.trackId]??[]).map(id=>entries.find(item=>item.id===id));
  return {...entry,summary:metadata.summary,version:2,readingMinutes,minutes:readingMinutes+30,
    prerequisites:prerequisites.map(({id,title})=>({id,title})),
    objectives:metadata.objectives??[metadata.summary,`Применить тему в задаче «${entry.title}» и объяснить граничные случаи.`],sections,exercise,
    questions:questions.map((q,i)=>{
      const shift=(index+i)%q.options.length;
      const sectionNumber=Math.min(q.section??i+1,sections.length);
      return {...q,id:`${entry.id}-${i+1}`,options:q.options.slice(shift).concat(q.options.slice(0,shift)),answer:(q.answer-shift+q.options.length)%q.options.length,sectionId:`section-${sectionNumber}`};
    })};
});
validateProgression(lessons);
mkdirSync(target,{recursive:true});
writeFileSync(new URL('lessons.json',target),JSON.stringify(lessons,null,2)+'\n');
console.log(`Built ${lessons.length} chapters, ${lessons.reduce((n,l)=>n+l.questions.length,0)} questions, ${lessons.reduce((n,l)=>n+l.exercise.tests.length,0)} code cases.`);
