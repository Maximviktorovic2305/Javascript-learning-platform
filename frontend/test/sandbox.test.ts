import { describe, it, expect } from 'vitest'
import { sandboxDocument, isPreviewResult } from '../app/utils/sandbox'
import { errorMessage } from '../app/utils/errorMessage'
describe('preview isolation', () => {
  it('keeps student markup out of the trusted frame bootstrap', () => {
    const document = sandboxDocument(
      'function solve(){return "</script><script>parent.evil()</script> Привет"}',
      [[]],
      'job-1',
    )
    expect(document.match(/<script /g)).toHaveLength(1)
    expect(document.match(/<\/script>/g)).toHaveLength(1)
    expect(document).not.toContain('parent.evil')
    expect(document).toContain("connect-src 'none'")
    expect(document).toContain('new Worker(')
    expect(document).not.toContain('allow-same-origin')
  })
  it('rejects malformed and oversized cross-window messages', () => {
    expect(isPreviewResult(null)).toBe(false)
    expect(isPreviewResult({ id: 1, ok: true })).toBe(false)
    expect(isPreviewResult({ id: '1', ok: 'yes' })).toBe(false)
    expect(isPreviewResult({ id: '1', ok: true, logs: [{}] })).toBe(false)
    expect(
      isPreviewResult({ id: '1', ok: true, outputs: Array(11).fill(1) }),
    ).toBe(false)
    expect(
      isPreviewResult({ id: '1', ok: false, error: 'x'.repeat(2001) }),
    ).toBe(false)
    expect(
      isPreviewResult({
        id: '1',
        ok: true,
        outputs: [false, null, { a: 1 }],
        logs: ['hi'],
      }),
    ).toBe(true)
  })
})
describe('API errors', () => {
  it('renders server validation and network failure without exposing internals', () => {
    expect(
      errorMessage({
        data: { message: ['email must be an email', 'name is too short'] },
      }),
    ).toContain('name is too short')
    expect(
      errorMessage({ stack: 'secret', message: 'internal database password' }),
    ).not.toContain('password')
  })
})
