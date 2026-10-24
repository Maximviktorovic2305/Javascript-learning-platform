import { localDay, progressSummary } from './progress';
describe('progress across timezone day boundaries', () => {
  const now = new Date('2026-10-23T15:00:00Z');
  const awards = [
    { key: 'theory:one', xp: 10, createdAt: new Date('2026-10-22T15:00:00Z') },
    { key: 'practice:one', xp: 50, createdAt: now },
    { key: 'quiz:one', xp: 30, createdAt: now },
  ];
  it('uses the learner timezone rather than host UTC day', () => {
    expect(localDay(now, 'Asia/Vladivostok')).toBe('2026-10-24');
    const summary = progressSummary(awards, 'Asia/Vladivostok', now);
    expect(summary).toMatchObject({
      xp: 90,
      todayXp: 80,
      streak: 2,
      solved: 1,
      quizzes: 1,
    });
    expect(summary.achievements.find((a) => a.id === 'code')?.unlocked).toBe(
      true,
    );
  });
  it('keeps yesterday streak before today activity, but resets after a missed day', () => {
    expect(
      progressSummary(
        awards,
        'Asia/Vladivostok',
        new Date('2026-10-24T15:00:00Z'),
      ).streak,
    ).toBe(2);
    expect(
      progressSummary(
        awards,
        'Asia/Vladivostok',
        new Date('2026-10-25T15:00:00Z'),
      ).streak,
    ).toBe(0);
    expect(progressSummary([], 'UTC', now)).toMatchObject({
      xp: 0,
      streak: 0,
      level: 1,
    });
  });
});
