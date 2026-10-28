const assert = require('node:assert/strict');
const { test } = require('node:test');
const merge = require('deepmerge');

const poisoned = () => JSON.parse('{"__proto__":{"injected":true},"safe":1}');
const safePrototype = (value) => {
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  assert.equal(value.injected, undefined);
  assert.equal({}.injected, undefined);
};

test('cloning target properties cannot replace the result prototype', () => {
  const result = merge(poisoned(), { added: 2 });
  safePrototype(result);
  assert.equal(result.safe, 1);
  assert.equal(result.added, 2);
});

test('null-prototype targets cannot bypass the source-key guard', () => {
  const result = merge(Object.create(null), poisoned());
  safePrototype(result);
  assert.equal(result.safe, 1);
});

test('own __proto__ keys stay data when both operands contain them', () => {
  const result = merge(poisoned(), poisoned());
  safePrototype(result);
  assert.equal(Object.hasOwn(result, '__proto__'), true);
  assert.equal(result.__proto__.injected, true);
});

test('nested merges and merge.all preserve ordinary prototypes', () => {
  safePrototype(merge({ nested: poisoned() }, { nested: { added: 1 } }).nested);
  safePrototype(merge.all([Object.create(null), poisoned()]));
});

test('objects, arrays, symbols, dates and merge options retain their contracts', () => {
  const symbol = Symbol('setting');
  const date = new Date('2026-01-01');
  const target = { nested: { a: 1 }, list: [{ a: 1 }], date, [symbol]: 'kept' };
  const result = merge(target, { nested: { b: 2 }, list: [{ b: 2 }] });
  assert.deepEqual(result.nested, { a: 1, b: 2 });
  assert.deepEqual(result.list, [{ a: 1 }, { b: 2 }]);
  assert.notEqual(result.list[0], target.list[0]);
  assert.equal(result.date, date);
  assert.equal(result[symbol], 'kept');
  assert.equal(merge({}, target, { clone: false }).nested, target.nested);
  assert.deepEqual(merge({ list: [1] }, { list: [2] }, { arrayMerge: (_a, b) => b }), { list: [2] });
  assert.deepEqual(merge({ count: 2 }, { count: { value: 3 } }, {
    customMerge: (key) => key === 'count' ? (a, b) => a + b.value : undefined,
  }), { count: 5 });
  assert.throws(() => merge.all({}), /array/);
});

test('ES module consumers receive the same merge implementation', async () => {
  const imported = await import('deepmerge');
  assert.equal(imported.default, merge);
});
