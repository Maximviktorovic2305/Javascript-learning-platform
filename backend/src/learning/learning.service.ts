import { BadRequestException, Injectable } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import { PrismaService } from '../common/database/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { RunnerService } from './runner.service';
import { CodeDto } from './learning.dto';
@Injectable()
export class LearningService {
  constructor(
    private readonly db: PrismaService,
    private readonly catalog: CatalogService,
    private readonly runner: RunnerService,
  ) {}
  async award(userId: string, key: string, xp: number) {
    // Unique (userId,key) + skipDuplicates keeps retries and concurrent requests idempotent.
    const result = await this.db.award.createMany({
      data: [{ userId, key, xp }],
      skipDuplicates: true,
    });
    return result.count ? xp : 0;
  }
  async read(userId: string, id: string) {
    this.catalog.getLesson(id);
    return { xp: await this.award(userId, `theory:${id}`, 10) };
  }
  async quiz(userId: string, id: string, answers: number[]) {
    const lesson = this.catalog.getLesson(id);
    if (answers.length !== lesson.questions.length)
      throw new BadRequestException('Ответьте на все вопросы.');
    const review = lesson.questions.map((q, index) => ({
      id: q.id,
      correct: answers[index] === q.answer,
      selected: answers[index],
      answer: q.answer,
      explanation: q.explanation,
    }));
    const score = Math.round(
      (review.filter((r) => r.correct).length / review.length) * 100,
    );
    await this.db.attempt.create({
      data: { userId, targetId: id, kind: 'quiz', score },
    });
    const passed = score >= 70;
    return {
      score,
      passed,
      xp: passed ? await this.award(userId, `quiz:${id}`, 30) : 0,
      review,
    };
  }
  async examples(id: string, dto: CodeDto) {
    const exercise = this.catalog.getLesson(id).exercise;
    if (dto.language !== exercise.language)
      throw new BadRequestException('Выберите язык задания.');
    // Only public cases go to the runner; previews never award XP or record attempts.
    return this.runner.execute(dto.code, dto.language, {
      ...exercise,
      tests: exercise.tests.slice(0, 2),
    });
  }
  async code(userId: string, id: string, dto: CodeDto) {
    const exercise = this.catalog.getLesson(id).exercise;
    if (dto.language !== exercise.language)
      throw new BadRequestException('Выберите язык задания.');
    const result = await this.runner.execute(dto.code, dto.language, exercise);
    if (!result.ok) {
      await this.db.attempt.create({
        data: { userId, targetId: id, kind: 'practice', score: 0 },
      });
      return { passed: false, xp: 0, message: result.message, tests: [] };
    }
    const tests = exercise.tests.map((test, index) => ({
      passed: isDeepStrictEqual(result.outputs[index], test.expected),
      index: index + 1,
    }));
    const passed = tests.every((test) => test.passed);
    await this.db.attempt.create({
      data: {
        userId,
        targetId: id,
        kind: 'practice',
        score: Math.round(
          (tests.filter((t) => t.passed).length / tests.length) * 100,
        ),
      },
    });
    return {
      passed,
      xp: passed ? await this.award(userId, `practice:${id}`, 50) : 0,
      tests,
      message: passed
        ? 'Все проверки пройдены!'
        : 'Есть несовпадения. Проверьте условие и граничные случаи.',
    };
  }
}
