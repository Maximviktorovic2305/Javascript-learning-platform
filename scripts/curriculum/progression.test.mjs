import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateProgression, withScaffoldImports } from './progression.mjs';
const lessons = JSON.parse(readFileSync(new URL('../../backend/src/catalog/data/lessons.json', import.meta.url), 'utf8'));

test('all 60 lessons use previously introduced code constructs and precede their dependants', () => {
  assert.equal(lessons.length, 60);
  validateProgression(lessons);
});
test('an introductory exercise cannot silently require conditions or callbacks', () => {
  for (const solution of ['function solve(value) { return value ? "yes" : "no"; }', 'function solve(values) { return values.reduce((sum, value) => sum + value, 0); }']) {
    const changed = structuredClone(lessons);
    changed[0].exercise.solution = solution;
    assert.throws(() => validateProgression(changed), /only taught in/);
  }
});
test('dynamic-import practice cannot move before async/await', () => {
  const changed = structuredClone(lessons);
  const index = changed.findIndex(lesson => lesson.id === 'javascript-modules');
  const [module] = changed.splice(index, 1);
  module.prerequisites = [];
  changed.splice(changed.findIndex(lesson => lesson.id === 'javascript-async'), 0, module);
  assert.throws(() => validateProgression(changed), /async is only taught/);
});
test('scaffolds provide only used imports without copying solution logic', () => {
  const task = { starterCode: 'async function solve() {}', solution: 'import { Module, Injectable } from "@nestjs/common"; async function solve() { @Module({}) class AppModule {} return 42; }' };
  const starter = withScaffoldImports(task);
  assert.match(starter, /import \{ Module \}/);
  assert.ok(!starter.includes('Injectable'));
  assert.ok(!starter.includes('return 42'));
  assert.equal(withScaffoldImports({ ...task, starterCode: starter }), starter);
});
