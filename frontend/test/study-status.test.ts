import { describe, it, expect } from 'vitest'
import {
  lessonStatus,
  stepStatus,
  lessonStage,
} from '../app/utils/lessonProgress'
describe('learning status uses saved stages and exact lesson IDs', () => {
  it('requires all three server awards to finish a topic', () => {
    const progress = { completed: ['theory:js', 'practice:js'], started: [] }
    expect(lessonStatus('js', progress)).toBe('in-progress')
    expect(stepStatus('js', 'theory', progress)).toBe('completed')
    expect(stepStatus('js', 'quiz', progress)).toBe('not-started')
    expect(lessonStage('js', progress.completed)).toBe('quiz')
    expect(
      lessonStatus(
        'js',
        { ...progress, completed: [...progress.completed, 'quiz:js'] },
        true,
      ),
    ).toBe('completed')
  })
  it('keeps failed attempts in progress without awarding completion', () => {
    const progress = { completed: [], started: ['practice:js', 'quiz:js'] }
    expect(lessonStatus('js', progress)).toBe('in-progress')
    expect(stepStatus('js', 'practice', progress)).toBe('in-progress')
    expect(stepStatus('js', 'theory', progress)).toBe('not-started')
    expect(lessonStatus('j', progress)).toBe('not-started')
  })
  it('marks the current stage as in progress but never overrides completion', () => {
    expect(lessonStatus('js', null, true)).toBe('in-progress')
    expect(stepStatus('js', 'practice', null, true)).toBe('in-progress')
    expect(
      stepStatus(
        'js',
        'practice',
        { completed: ['practice:js'], started: [] },
        true,
      ),
    ).toBe('completed')
    expect(lessonStatus('js')).toBe('not-started')
  })
})
