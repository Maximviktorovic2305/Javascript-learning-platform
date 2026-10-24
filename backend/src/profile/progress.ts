export function localDay(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export function progressSummary(
  awards: { key: string; xp: number; createdAt: Date }[],
  timezone: string,
  now = new Date(),
) {
  const today = localDay(now, timezone);
  const activity = new Map<string, number>();
  for (const award of awards) {
    const day = localDay(award.createdAt, timezone);
    activity.set(day, (activity.get(day) ?? 0) + award.xp);
  }
  const cursor = new Date(`${today}T12:00:00Z`);
  if (!activity.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (activity.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const xp = awards.reduce((sum, a) => sum + a.xp, 0);
  const solved = awards.filter((a) => a.key.startsWith('practice:')).length;
  const quizzes = awards.filter((a) => a.key.startsWith('quiz:')).length;
  return {
    xp,
    todayXp: activity.get(today) ?? 0,
    streak,
    solved,
    quizzes,
    level: Math.floor(xp / 500) + 1,
    activity: [...activity]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, xp]) => ({ day, xp })),
    completed: awards.map((a) => a.key),
    achievements: [
      {
        id: 'start',
        title: 'Первый шаг',
        description: 'Изучите первую тему',
        unlocked: awards.some((a) => a.key.startsWith('theory:')),
      },
      {
        id: 'code',
        title: 'Код работает',
        description: 'Решите первую задачу',
        unlocked: solved >= 1,
      },
      {
        id: 'five',
        title: 'В потоке',
        description: 'Решите 5 задач',
        unlocked: solved >= 5,
      },
      {
        id: 'quiz',
        title: 'Всё понятно',
        description: 'Пройдите первый тест',
        unlocked: quizzes >= 1,
      },
      {
        id: 'week',
        title: 'Привычка учиться',
        description: 'Занимайтесь 7 дней подряд',
        unlocked: streak >= 7,
      },
      {
        id: 'xp',
        title: 'Тысяча идей',
        description: 'Заработайте 1000 XP',
        unlocked: xp >= 1000,
      },
    ],
  };
}
