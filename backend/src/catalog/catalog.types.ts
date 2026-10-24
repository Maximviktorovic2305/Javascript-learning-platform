export type TrackId = 'javascript' | 'typescript' | 'express' | 'nest';
export interface TestCase {
  input: unknown[];
  expected: unknown;
}
export interface Exercise {
  id: string;
  title: string;
  prompt: string;
  language: 'javascript' | 'typescript';
  runtime: 'universal' | 'node';
  starterCode: string;
  solution: string;
  hint: string;
  tests: TestCase[];
}
export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Lesson {
  id: string;
  trackId: TrackId;
  title: string;
  summary: string;
  minutes: number;
  module?: string;
  readingMinutes?: number;
  objectives?: string[];
  sources?: { title: string; url: string }[];
  sections: {
    id?: string;
    title: string;
    text?: string;
    code?: string;
    output?: string;
    blocks?: (
      | {
          type: 'paragraph' | 'code' | 'output';
          text: string;
          language?: string;
        }
      | { type: 'list'; items: string[] }
    )[];
  }[];
  exercise: Exercise;
  questions: Question[];
}
