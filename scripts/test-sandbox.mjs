import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const ts = createRequire(new URL('../backend/package.json', import.meta.url))('typescript');
const {execute}=await import(process.env.SANDBOX_ENGINE==='nsjail'?'../runner/nsjail.mjs':'../runner/docker.mjs');
const lessons=JSON.parse(readFileSync(new URL('../backend/src/catalog/data/lessons.json',import.meta.url),'utf8'));
const { appliedValueFixtures, appliedHttpFixtures } = await import('./curriculum/applied.mjs');
// Execute authored quiz examples in the same disposable sandbox as practice.
// Browser APIs are explicit fixtures here, never API/host globals.
const quizCode = `async function solve() {
  const { document, Event } = require("linkedom").parseHTML("<!doctype html><html><body></body></html>");
  const storage = new Map<string, string>();
  const localStorage = {
    setItem(key: string, value: unknown) { storage.set(key, String(value)); },
    getItem(key: string) { return storage.get(key) ?? null; },
    removeItem(key: string) { storage.delete(key); }
  };
  const outputs: unknown[] = [];
  ${appliedValueFixtures.map(({ code }) => `{\n${code}\noutputs.push(result);\n}`).join('\n')}
  return outputs;
}`;
// Remove annotations as text so JS examples retain their own language semantics;
// do not impose TS noImplicitAny on introductory JavaScript examples.
const quizJs = ts.transpileModule(quizCode, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const quizResult = await execute({ code: quizJs, language: 'javascript', inputs: [[]] });
assert.equal(quizResult.ok, true, quizResult.error);
assert.deepEqual(quizResult.outputs, [appliedValueFixtures.map(item => item.expected)]);
console.log(`PASS ${appliedValueFixtures.length} standalone quiz value examples`);
const httpCode = `async function solve() {
  const request = require("supertest");
  const outputs = [];
  ${appliedHttpFixtures.map(fixture => `{
    ${fixture.code}
    const response = await request(app)[${JSON.stringify(fixture.method)}](${JSON.stringify(fixture.path)})${fixture.body ? `.send(${JSON.stringify(fixture.body)})` : ''};
    outputs.push(${/^\d{3}$/.test(fixture.correct) ? 'String(response.status)' : /^[{[]/.test(fixture.correct) ? 'JSON.stringify(response.body)' : 'response.text'});
  }`).join('\n')}
  return outputs;
}`;
const httpQuizResult = await execute({ code: httpCode, language: 'javascript', inputs: [[]] });
assert.equal(httpQuizResult.ok, true, httpQuizResult.error);
assert.deepEqual(httpQuizResult.outputs, [appliedHttpFixtures.map(item => item.correct)]);
console.log(`PASS ${appliedHttpFixtures.length} standalone HTTP quiz examples`);
let passed=0;
const literal=await execute({code:'function solve(){return "${HOME} $USER $$"}',language:'javascript',inputs:[[]]});
assert.deepEqual(literal.outputs,['${HOME} $USER $$'],'Sandbox must preserve literal dollar sequences');
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
