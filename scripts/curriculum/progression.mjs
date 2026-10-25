import { createRequire } from 'node:module';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const ts = require('typescript');

// First *explained* use. A minimal function/return frame is explicitly taught
// in start; callbacks and complete function syntax wait for functions.
const introductions = {
  objects: 'javascript-values',
  conditions: 'javascript-conditions',
  loops: 'javascript-loops',
  callbacks: 'javascript-functions',
  arrays: 'javascript-arrays',
  classes: 'javascript-classes',
  exceptions: 'javascript-errors',
  async: 'javascript-async',
  modules: 'javascript-modules',
  interfaces: 'typescript-interfaces',
  generics: 'typescript-generics',
  indexedTypes: 'typescript-keyof',
  utilityTypes: 'typescript-utility',
  mappedTypes: 'typescript-mapped',
};

export function codeConcepts(source) {
  const concepts = new Set();
  const ast = ts.createSourceFile('example.ts', source, ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) concepts.add('objects');
    if (ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isSwitchStatement(node)) concepts.add('conditions');
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) concepts.add('loops');
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) concepts.add('callbacks');
    if (ts.isArrayLiteralExpression(node)) concepts.add('arrays');
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) concepts.add('classes');
    if (ts.isTryStatement(node) || ts.isThrowStatement(node)) concepts.add('exceptions');
    if (ts.isAwaitExpression(node) || node.modifiers?.some(item => item.kind === ts.SyntaxKind.AsyncKeyword)) concepts.add('async');
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || node.modifiers?.some(item => item.kind === ts.SyntaxKind.ExportKeyword) || ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) concepts.add('modules');
    if (ts.isInterfaceDeclaration(node)) concepts.add('interfaces');
    if (node.typeParameters?.length) concepts.add('generics');
    if (ts.isIndexedAccessTypeNode(node) || ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword) concepts.add('indexedTypes');
    if (ts.isMappedTypeNode(node) || ts.isConditionalTypeNode(node) || ts.isInferTypeNode(node)) concepts.add('mappedTypes');
    if (ts.isTypeReferenceNode(node) && /^(Record|Partial|Required|Readonly|Pick|Omit|ReturnType|Parameters|Awaited)$/.test(node.typeName.getText(ast))) concepts.add('utilityTypes');
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return [...concepts];
}

export function validateProgression(lessons) {
  const positions = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  for (const [index, lesson] of lessons.entries()) {
    for (const dependency of lesson.prerequisites ?? []) {
      if (!positions.has(dependency.id) || positions.get(dependency.id) >= index) throw new Error(`${lesson.id}: prerequisite must precede lesson: ${dependency.id}`);
    }
    const samples = lesson.sections.flatMap(section => (section.blocks ?? []).filter(block => block.type === 'code' && ['javascript', 'typescript'].includes(block.language)).map(block => ({ label: section.title, code: block.text })));
    samples.push({ label: 'practice solution', code: lesson.exercise.solution });
    for (const question of lesson.questions) if (question.code) samples.push({ label: question.prompt, code: question.code });
    for (const sample of samples) for (const concept of codeConcepts(sample.code)) {
      const introduction = introductions[concept];
      if (!positions.has(introduction) || positions.get(introduction) > index) throw new Error(`${lesson.id} / ${sample.label}: ${concept} is only taught in ${introduction}`);
    }
  }
}

export function withScaffoldImports(exercise) {
  const source = ts.createSourceFile('solution.ts', exercise.solution, ts.ScriptTarget.Latest, true);
  const used = new Set();
  for (const statement of source.statements) if (!ts.isImportDeclaration(statement)) {
    const visit = node => { if (ts.isIdentifier(node)) used.add(node.text); ts.forEachChild(node, visit); };
    visit(statement);
  }
  const imports = [];
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (!clause) { imports.push(statement.getText(source)); continue; }
      const parts = [];
      if (clause.name && used.has(clause.name.text)) parts.push(clause.name.text);
      const named = clause.namedBindings;
      if (named && ts.isNamedImports(named)) {
        const names = named.elements.filter(item => used.has(item.name.text)).map(item => item.getText(source));
        if (names.length) parts.push(`{ ${names.join(', ')} }`);
      } else if (named && used.has(named.name.text)) parts.push(named.getText(source));
      if (parts.length) imports.push(`import ${clause.isTypeOnly ? 'type ' : ''}${parts.join(', ')} from ${statement.moduleSpecifier.getText(source)};`);
    } else if (ts.isVariableStatement(statement) && statement.declarationList.declarations.every(declaration => declaration.initializer && ts.isCallExpression(declaration.initializer) && declaration.initializer.expression.getText(source) === 'require')) imports.push(statement.getText(source));
  }
  const missing = imports.filter(statement => !exercise.starterCode.includes(statement));
  // Scaffolding supplies library connections, never a hidden solution or driver.
  return missing.length ? `${missing.join('\n')}\n\n${exercise.starterCode}` : exercise.starterCode;
}
