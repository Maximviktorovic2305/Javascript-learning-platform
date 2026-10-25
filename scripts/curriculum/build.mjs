// Build-only authoring parser: structured blocks, never raw HTML.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { outline } from './outline.mjs';
import { additions, revisions } from './assessments.mjs';
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
  // Applied questions use only already-public examples, never hidden cases.
  const contractQuestions=[exercise.tests[0],exercise.tests[1]??exercise.tests[0]].map((test,exampleIndex)=>{
    const call=`${/\basync\s+function\s+solve\b/.test(exercise.starterCode)?'await ':''}solve(${test.input.map(v=>JSON.stringify(v)).join(', ')})`;
    const context=exercise.prompt;
    const code=`const result = ${call};`;
    if(exampleIndex===1&&exercise.tests.length===1){
      const kind=Array.isArray(test.expected)?'массив':test.expected===null?'null':typeof test.expected==='object'?'объект':typeof test.expected==='number'?'число':typeof test.expected==='string'?'строка':'boolean';
      const wrong=['массив','объект','строка','число','null','boolean'].filter(value=>value!==kind).slice(0,2);
      return {prompt:'Какую форму имеет значение result после показанного вызова?',context,code,options:[kind,...wrong],answer:0,section:sections.length,explanation:`После ${call} переменная result содержит ${JSON.stringify(test.expected)}. Это ${kind}. ${exercise.hint}`};
    }
    const correct=JSON.stringify(test.expected);
    const alternatives=typeof test.expected==='number'?[test.expected+1,test.expected-1]:typeof test.expected==='boolean'?[!test.expected,'TypeError']:Array.isArray(test.expected)?[[],test.expected.slice().reverse(),null]:typeof test.expected==='object'?[null,{},'TypeError']:['',null,'TypeError'];
    const wrong=[...new Set(alternatives.map(value=>JSON.stringify(value)))].filter(value=>value!==correct).slice(0,2);
    if(wrong.length!==2)wrong.push('undefined');
    return {prompt:'Какое значение получит result, если solve выполнит приведённое условие?',context,code,options:[correct,...wrong],answer:0,section:sections.length,explanation:`После ${call} переменная result содержит ${correct}. ${exercise.hint}`};
  });
  const questions=[...metadata.questions,...contractQuestions];
  if(questions.length!==5)throw new Error(`Expected 3 conceptual and 2 applied questions: ${entry.id}`);
  const readingMinutes=Math.ceil(words/140)+examples;
  const previous=entries.slice(0,index).filter(x=>x.trackId===entry.trackId).at(-1);
  return {...entry,summary:metadata.summary,version:2,readingMinutes,minutes:readingMinutes+30,
    prerequisites:previous?[{id:previous.id,title:previous.title}]:[],
    objectives:metadata.objectives??[metadata.summary,`Применить тему в задаче «${entry.title}» и объяснить граничные случаи.`],sections,exercise,
    questions:questions.map((q,i)=>{
      const shift=(index+i)%q.options.length;
      const sectionNumber=Math.min(q.section??i+1,sections.length);
      return {...q,id:`${entry.id}-${i+1}`,options:q.options.slice(shift).concat(q.options.slice(0,shift)),answer:(q.answer-shift+q.options.length)%q.options.length,sectionId:`section-${sectionNumber}`};
    })};
});
mkdirSync(target,{recursive:true});
writeFileSync(new URL('lessons.json',target),JSON.stringify(lessons,null,2)+'\n');
console.log(`Built ${lessons.length} chapters, ${lessons.reduce((n,l)=>n+l.questions.length,0)} questions, ${lessons.reduce((n,l)=>n+l.exercise.tests.length,0)} code cases.`);
