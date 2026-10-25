import { CatalogService } from './catalog.service';
import ts from 'typescript';
describe('JS/TS curriculum', () => {
  const catalog = new CatalogService();
  it('publishes complete JS, TS, Express and Nest tracks without answer leakage', () => {
    expect(catalog.tracks().map((t) => t.id)).toEqual([
      'javascript',
      'typescript',
      'express',
      'nest',
    ]);
    expect(catalog.allLessons()).toHaveLength(60);
    expect(catalog.tracks().map((track) => track.lessonCount)).toEqual([
      22, 12, 12, 14,
    ]);
    for (const lesson of catalog.allLessons()) {
      const dto = catalog.publicLesson(lesson.id);
      expect(dto.sections.length).toBeGreaterThanOrEqual(6);
      const blocks = dto.sections.flatMap((section) => section.blocks ?? []);
      expect(
        blocks.filter((block) => block.type === 'code').length,
      ).toBeGreaterThanOrEqual(3);
      const words = blocks
        .flatMap((block) =>
          block.type === 'list'
            ? block.items
            : block.type === 'paragraph'
              ? [block.text]
              : [],
        )
        .join(' ')
        .split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(450);
      expect(
        dto.sources?.every(
          (source) => new URL(source.url).protocol === 'https:',
        ),
      ).toBe(true);
      expect(dto.questions).toHaveLength(5);
      expect(dto.exercise).not.toHaveProperty('solution');
      expect(dto.exercise).not.toHaveProperty('tests');
      expect(dto.exercise.examples).toEqual(lesson.exercise.tests.slice(0, 2));
      expect(
        dto.questions.every((q) => !('answer' in q) && !('explanation' in q)),
      ).toBe(true);
      expect(lesson.exercise.tests.length).toBeGreaterThan(0);
      expect(lesson.exercise.tests.length).toBeLessThanOrEqual(10);
      expect(
        lesson.questions.every(
          (q) => q.answer >= 0 && q.answer < q.options.length,
        ),
      ).toBe(true);
    }
  });
  it('all authored solutions and scaffolds have valid syntax without executing student code', () => {
    for (const lesson of catalog.allLessons())
      for (const code of [
        lesson.exercise.starterCode,
        lesson.exercise.solution,
      ]) {
        const result = ts.transpileModule(code, {
          reportDiagnostics: true,
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            experimentalDecorators: true,
          },
        });
        expect(
          result.diagnostics?.filter(
            (d) => d.category === ts.DiagnosticCategory.Error,
          ),
        ).toEqual([]);
      }
  });
  it('shows standalone code for applied questions without relying on a practice implementation', () => {
    for (const lesson of catalog.allLessons()) {
      const applied = lesson.questions.slice(3);
      expect(applied).toHaveLength(2);
      applied.forEach((question) => {
        expect(question.code?.trim().length).toBeGreaterThan(0);
        expect(question.code).not.toMatch(/\bsolve\s*\(/);
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.explanation.trim().length).toBeGreaterThan(20);
        expect(question.prompt).not.toMatch(
          /опубликованном примере|контракт задачи|приведённое условие/,
        );
      });
    }
    const generics = catalog.getLesson('typescript-generics').questions[1];
    expect(generics.code).toContain('function first<T>');
  });
  it('rejects missing content instead of returning a placeholder', () => {
    expect(() => catalog.getLesson('not-a-lesson')).toThrow('Тема не найдена.');
  });
});
