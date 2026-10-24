import { Injectable, NotFoundException } from '@nestjs/common';
import rawLessons from './data/lessons.json';
import type { Lesson } from './catalog.types';
const lessons = rawLessons as Lesson[];
export const tracks = [
  {
    id: 'javascript',
    name: 'JavaScript',
    mark: 'JS',
    label: 'Основа всего',
    description:
      'От первой переменной до асинхронности. Научитесь мыслить кодом и решать реальные задачи.',
    level: 'С нуля',
    color: 'lime',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    mark: 'TS',
    label: 'Уверенность в коде',
    description:
      'Типы, интерфейсы и generics. Находите ошибки до запуска программы.',
    level: 'После JavaScript',
    color: 'blue',
  },
  {
    id: 'express',
    name: 'Express',
    mark: 'ex',
    label: 'Первый бэкенд',
    description: 'HTTP, middleware и маршруты. Создайте свой API на Node.js.',
    level: 'После JavaScript',
    color: 'white',
  },
  {
    id: 'nest',
    name: 'NestJS',
    mark: 'N',
    label: 'Архитектура приложения',
    description:
      'Модули, DI, контроллеры и guards. Стройте приложения с понятной структурой.',
    level: 'После TypeScript',
    color: 'pink',
  },
];
export const projects = [
  {
    id: 'js-tracker',
    trackId: 'javascript',
    title: 'Трекер привычек',
    description:
      'Приложение для ежедневных привычек с историей и локальным хранением.',
    criteria: [
      'Добавление и удаление привычек',
      'Отметка по дням и подсчёт серии',
      'Сохранение в localStorage',
      'Клавиатура и адаптивный интерфейс',
    ],
    stack: 'JavaScript · DOM · Web Storage',
  },
  {
    id: 'ts-client',
    trackId: 'typescript',
    title: 'Типизированный API-клиент',
    description:
      'Клиент каталога с runtime-валидацией ответов и обработкой ошибок.',
    criteria: [
      'Generic функция запроса',
      'Валидация unknown данных',
      'Обработка HTTP-ошибок и отмена',
      'Тесты успешных и ошибочных сценариев',
    ],
    stack: 'TypeScript · Fetch · Generics',
  },
  {
    id: 'express-api',
    trackId: 'express',
    title: 'REST API заметок',
    description: 'Сервер заметок с маршрутизацией, проверкой ввода и тестами.',
    criteria: [
      'CRUD заметок через Router',
      'Проверка body и параметров',
      'Централизованные ошибки',
      'Интеграционные тесты supertest',
    ],
    stack: 'Express · Node.js · Supertest',
  },
  {
    id: 'nest-library',
    trackId: 'nest',
    title: 'Библиотека на NestJS',
    description:
      'Модульное приложение с каталогом книг и правами пользователей.',
    criteria: [
      'Отдельные feature-модули',
      'DTO и ValidationPipe',
      'Авторизация через guards',
      'Сервисы с DI и unit-тестами',
    ],
    stack: 'NestJS · TypeScript · Prisma',
  },
];
@Injectable()
export class CatalogService {
  allLessons() {
    return lessons;
  }
  tracks() {
    return tracks.map((track) => ({
      ...track,
      lessonCount: lessons.filter((l) => l.trackId === track.id).length,
      minutes: lessons
        .filter((l) => l.trackId === track.id)
        .reduce((n, l) => n + l.minutes, 0),
      lessons: lessons
        .filter((l) => l.trackId === track.id)
        .map(({ id, title, summary, minutes }) => ({
          id,
          title,
          summary,
          minutes,
        })),
    }));
  }
  getLesson(id: string) {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) throw new NotFoundException('Тема не найдена.');
    return lesson;
  }
  publicLesson(id: string) {
    const { questions, exercise, ...lesson } = this.getLesson(id);
    const { solution: _solution, tests, ...task } = exercise;
    return {
      ...lesson,
      exercise: { ...task, examples: tests.slice(0, 2) },
      questions: questions.map(
        ({ answer: _answer, explanation: _explanation, ...question }) =>
          question,
      ),
    };
  }
  exercises() {
    return lessons.map(({ id, trackId, title, summary, exercise }) => ({
      id,
      trackId,
      title,
      summary,
      language: exercise.language,
      runtime: exercise.runtime,
    }));
  }
  projects() {
    return projects;
  }
}
