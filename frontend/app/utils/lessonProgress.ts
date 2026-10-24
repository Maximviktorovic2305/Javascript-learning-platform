import type { Progress } from '#shared/types/api'
export type StudyStatus = 'not-started' | 'in-progress' | 'completed'
export type StudyStep = 'theory' | 'practice' | 'quiz'
export function stepStatus(
  id: string,
  step: StudyStep,
  progress?: Pick<Progress, 'completed' | 'started'> | null,
  current = false,
): StudyStatus {
  const key = `${step}:${id}`
  if (progress?.completed.includes(key)) return 'completed'
  if (current || progress?.started?.includes(key)) return 'in-progress'
  return 'not-started'
}
export function lessonStatus(
  id: string,
  progress?: Pick<Progress, 'completed' | 'started'> | null,
  current = false,
): StudyStatus {
  const stages = ['theory', 'practice', 'quiz'] as const
  if (stages.every((step) => stepStatus(id, step, progress) === 'completed'))
    return 'completed'
  if (
    current ||
    stages.some((step) => stepStatus(id, step, progress) !== 'not-started')
  )
    return 'in-progress'
  return 'not-started'
}
export function lessonStage(id: string, completed: readonly string[]) {
  for (const stage of ['theory', 'practice', 'quiz'] as const)
    if (!completed.includes(`${stage}:${id}`)) return stage
  return 'done' as const
}
export function isLessonComplete(id: string, completed: readonly string[]) {
  return lessonStage(id, completed) === 'done'
}
