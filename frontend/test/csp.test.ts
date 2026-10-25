import { describe, expect, it } from 'vitest'
import { pageCsp } from '../shared/csp'

describe('document CSP', () => {
  it('keeps scripts nonce-only while permitting isolated workers', () => {
    const value = pageCsp('test-random-nonce-0123456789')
    const scripts = value
      .split('; ')
      .find((directive) => directive.startsWith('script-src '))!
    expect(scripts).toContain("'strict-dynamic'")
    expect(scripts).toContain("'nonce-test-random-nonce-0123456789'")
    expect(scripts).not.toContain('unsafe-inline')
    expect(value).not.toContain('unsafe-eval')
    expect(value).toContain("worker-src 'self' blob:")
    expect(value).toContain("object-src 'none'")
    expect(value).not.toContain('*')
  })
  it('rejects attacker-controlled header syntax in a nonce', () => {
    expect(() => pageCsp("x'; script-src *")).toThrow('nonce')
  })
})
