import { it, expect } from 'vitest'
import { lessonStage, isLessonComplete } from '../app/utils/lessonProgress'
it('continues the unfinished stage rather than skipping practice and quizzes', () => {
  expect(lessonStage('js', [])).toBe('theory')
  expect(lessonStage('js', ['theory:js'])).toBe('practice')
  expect(lessonStage('js', ['theory:js', 'practice:js'])).toBe('quiz')
  expect(isLessonComplete('js', ['theory:js', 'practice:js', 'quiz:js'])).toBe(
    true,
  )
  expect(isLessonComplete('ts', ['theory:js', 'practice:js', 'quiz:js'])).toBe(
    false,
  )
})
