import { CatalogService } from '../catalog/catalog.service';
import { PrismaService } from '../common/database/prisma.service';
import { LearningService } from './learning.service';
import { RunnerService } from './runner.service';

describe('Public example execution', () => {
  const catalog = new CatalogService();
  const db = {
    award: { createMany: jest.fn() },
    attempt: { create: jest.fn() },
  };
  const runner = { execute: jest.fn() };
  const learning = new LearningService(
    db as unknown as PrismaService,
    catalog,
    runner as unknown as RunnerService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('sends only published examples to the isolated runner across all tracks, without progress writes', async () => {
    for (const lesson of catalog.allLessons()) {
      const exercise = lesson.exercise;
      const outputs = exercise.tests.slice(0, 2).map((test) => test.expected);
      runner.execute.mockResolvedValueOnce({ ok: true, outputs, message: '' });
      const result = await learning.examples(lesson.id, {
        code: exercise.starterCode,
        language: exercise.language,
      });
      expect(runner.execute).toHaveBeenLastCalledWith(
        exercise.starterCode,
        exercise.language,
        { ...exercise, tests: exercise.tests.slice(0, 2) },
      );
      expect(result).toEqual({ ok: true, outputs, message: '' });
    }
    expect(db.award.createMany).not.toHaveBeenCalled();
    expect(db.attempt.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown lesson or mismatched language before execution', async () => {
    await expect(
      learning.examples('missing', {
        code: 'function solve() {}',
        language: 'javascript',
      }),
    ).rejects.toThrow('Тема не найдена.');
    await expect(
      learning.examples('express-http', {
        code: 'function solve() {}',
        language: 'typescript',
      }),
    ).rejects.toThrow('Выберите язык задания.');
    expect(runner.execute).not.toHaveBeenCalled();
  });

  it('returns execution failures without grading or awarding XP', async () => {
    runner.execute.mockResolvedValueOnce({
      ok: false,
      outputs: [],
      message: 'Превышено время выполнения.',
    });
    expect(
      await learning.examples('express-http', {
        code: 'function solve() {}',
        language: 'javascript',
      }),
    ).toEqual({
      ok: false,
      outputs: [],
      message: 'Превышено время выполнения.',
    });
    expect(db.award.createMany).not.toHaveBeenCalled();
    expect(db.attempt.create).not.toHaveBeenCalled();
  });
});
