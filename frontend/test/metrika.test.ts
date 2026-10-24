import { describe, expect, it } from 'vitest'
import { analyticsUrl, createMetrikaClient } from '../app/utils/metrika'

function fixture() {
  const scripts = new Map<
    string,
    { id: string; src: string; remove: () => void; onerror?: () => void }
  >()
  const win = {
    location: {
      origin: 'https://js-lab.site',
      href: 'https://js-lab.site/?email=private#secret',
    },
  } as Window
  const doc = {
    referrer: 'https://example.test/?token=private#secret',
    getElementById: (id: string) => scripts.get(id),
    createElement: () => {
      const element = {
        id: '',
        src: '',
        remove: () => scripts.delete(element.id),
      }
      return element
    },
    head: {
      append: (element: { id: string; src: string; remove: () => void }) =>
        scripts.set(element.id, element),
    },
  } as unknown as Document
  return { scripts, win, client: createMetrikaClient(win, doc) }
}
describe('consent-controlled Metrika adapter', () => {
  it('does nothing before an explicit start and rejects invalid IDs', () => {
    const { scripts, win, client } = fixture()
    client.page('/courses')
    client.start(0)
    client.start(Number.NaN)
    expect(scripts.size).toBe(0)
    expect(win.ym).toBeUndefined()
  })
  it('initializes once, removes query secrets and deduplicates SPA pageviews', () => {
    const { scripts, win, client } = fixture()
    client.start(123)
    client.start(123)
    client.page('/learn/values?token=private#answer')
    client.page('/learn/values')
    expect(scripts.size).toBe(1)
    expect(win.ym?.a?.filter((command) => command[1] === 'init')).toHaveLength(
      1,
    )
    expect(win.ym?.a?.filter((command) => command[1] === 'hit')).toHaveLength(1)
    expect(JSON.stringify(win.ym?.a)).not.toContain('private')
    expect(JSON.stringify(win.ym?.a)).not.toContain('answer')
    expect(win.ym?.a?.[0]?.[2]).toMatchObject({
      defer: true,
      webvisor: true,
      sendTitle: false,
    })
  })
  it('clears queued tracking on refusal and recovers from a blocked SDK', () => {
    const { scripts, win, client } = fixture()
    client.start(123)
    client.stop()
    client.page('/profile')
    expect(scripts.size).toBe(0)
    expect(win.ym?.a).toEqual([])
    client.start(123)
    scripts.get('jslab-metrika-sdk')?.onerror?.()
    expect(scripts.size).toBe(0)
    expect(win.ym?.a).toEqual([])
    client.start(123)
    expect(scripts.size).toBe(1)
  })
  it('strips tokens and fragments from attribution URLs', () => {
    expect(
      analyticsUrl('/auth/login?email=private#token', 'https://js-lab.site'),
    ).toBe('https://js-lab.site/auth/login')
    expect(analyticsUrl('javascript:alert(1)', 'https://js-lab.site')).toBe('')
  })
})
