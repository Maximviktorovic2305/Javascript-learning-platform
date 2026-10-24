export type TrackId = 'javascript' | 'typescript' | 'express' | 'nest'
export interface LessonSummary {
  id: string
  title: string
  summary: string
  minutes: number
  module?: string
}
export type TheoryBlock =
  | { type: 'paragraph' | 'code' | 'output'; text: string; language?: string }
  | { type: 'list'; items: string[] }
export interface TheorySection {
  id?: string
  title: string
  blocks?: TheoryBlock[]
  text?: string
  code?: string
  output?: string
}
export interface Track {
  id: TrackId
  name: string
  mark: string
  label: string
  description: string
  level: string
  color: string
  lessonCount: number
  minutes: number
  lessons: LessonSummary[]
}
export interface Exercise {
  id: string
  title: string
  prompt: string
  language: 'javascript' | 'typescript'
  runtime: 'universal' | 'node'
  starterCode: string
  hint: string
  examples: { input: unknown[]; expected: unknown }[]
}
export interface Lesson extends LessonSummary {
  trackId: TrackId
  sections: TheorySection[]
  readingMinutes?: number
  objectives?: string[]
  sources?: { title: string; url: string }[]
  exercise: Exercise
  questions: { id: string; prompt: string; options: string[] }[]
}
export interface User {
  id: string
  name: string
  email: string
  timezone: string
  dailyGoal: number
  createdAt: string
}
export interface Progress {
  xp: number
  todayXp: number
  streak: number
  solved: number
  quizzes: number
  level: number
  completed: string[]
  started: string[]
  activity: { day: string; xp: number }[]
  achievements: {
    id: string
    title: string
    description: string
    unlocked: boolean
  }[]
}
export interface ExerciseSummary {
  id: string
  trackId: TrackId
  title: string
  summary: string
  language: Exercise['language']
  runtime: Exercise['runtime']
}
export interface Project {
  id: string
  trackId: TrackId
  title: string
  description: string
  criteria: string[]
  stack: string
}
export interface ProjectSubmission {
  projectId: string
  url: string
  status: string
  createdAt: string
}
export interface Grade {
  passed: boolean
  xp: number
  message: string
  tests: { passed: boolean; index: number }[]
}
export interface QuizResult {
  passed: boolean
  score: number
  xp: number
  review: {
    id: string
    correct: boolean
    selected: number
    answer: number
    explanation: string
  }[]
}
