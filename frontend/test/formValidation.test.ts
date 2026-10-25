import { describe, expect, it } from 'vitest'
import {
  nameError,
  emailError,
  passwordError,
  timezoneError,
  projectUrlError,
  dailyGoalError,
} from '../app/utils/formValidation'

describe('Russian form validation', () => {
  it('accepts custom whole XP goals and rejects empty or out-of-range values', () => {
    for (const value of [1, 137, '999', 2147483647])
      expect(dailyGoalError(value)).toBe('')
    for (const value of ['', 0, -1, 1.5, 'oops', Infinity, 2147483648])
      expect(dailyGoalError(value)).toMatch(/[А-Яа-я]/)
  })
  it('rejects empty, whitespace-only and malformed registration fields', () => {
    for (const name of ['', '   ', 'A', 'a'.repeat(61)])
      expect(nameError(name)).not.toBe('')
    for (const email of ['', 'student', 'a@b', 'a b@example.com'])
      expect(emailError(email)).not.toBe('')
    for (const password of ['', 'short', 'a'.repeat(129)])
      expect(passwordError(password)).not.toBe('')
    expect(nameError('  Макс  ')).toBe('')
    expect(emailError('student@example.com')).toBe('')
    expect(passwordError('a'.repeat(10))).toBe('')
  })

  it('counts Unicode characters consistently with the server', () => {
    expect(nameError('😀')).not.toBe('')
    expect(passwordError('😀'.repeat(9))).not.toBe('')
    expect(passwordError('😀'.repeat(10))).toBe('')
  })

  it('validates profile timezones and HTTPS project links', () => {
    expect(timezoneError('Asia/Vladivostok')).toBe('')
    expect(timezoneError('Missing/Zone')).not.toBe('')
    expect(timezoneError('')).not.toBe('')
    expect(projectUrlError('https://github.com/you/project')).toBe('')
    for (const url of [
      '',
      'github.com/you/project',
      'http://example.com',
      'https://localhost',
    ])
      expect(projectUrlError(url)).not.toBe('')
  })
})
