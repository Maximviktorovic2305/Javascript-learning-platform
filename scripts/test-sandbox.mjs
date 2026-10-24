import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {execute} from '../runner/docker.mjs';
const lessons=JSON.parse(readFileSync(new URL('../backend/src/catalog/data/lessons.json',import.meta.url),'utf8'));
let passed=0;
for(const lesson of lessons){
  const result=await execute({code:lesson.exercise.solution,language:lesson.exercise.language,inputs:lesson.exercise.tests.map(test=>test.input)});
  assert.equal(result.ok,true,`${lesson.id}: ${result.error}`);
  assert.deepEqual(result.outputs,lesson.exercise.tests.map(test=>test.expected),lesson.id);
  console.log(`PASS ${lesson.id} (${result.outputs.length} cases)`);passed+=result.outputs.length;
}
for(const [name,code] of [
  ['infinite loop','function solve(){while(true){}}'],
  ['output limit','function solve(){process.stdout.write("x".repeat(100000));return 1}'],
  ['read-only root','function solve(){require("fs").writeFileSync("/opt/app/escape","x");return true}'],
  ['no network','async function solve(){return await (await fetch("https://example.com",{signal:AbortSignal.timeout(1000)})).text()}'],
  ['strict TypeScript','function solve(n: number): number { return "wrong"; }'],
]){
  const result=await execute({code,language:name==='strict TypeScript'?'typescript':'javascript',inputs:[[]]}, {timeoutMs:name==='infinite loop'?1500:15000});
  assert.equal(result.ok,false,`${name} should fail`);console.log(`PASS isolation: ${name}`);
}
console.log(`Validated ${lessons.length} solutions and ${passed} cases, plus isolation checks.`);
