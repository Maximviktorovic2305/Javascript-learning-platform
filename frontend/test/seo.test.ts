import { describe, expect, it } from 'vitest'
import { canonicalUrl, serializeJsonLd, sitemapXml } from '../shared/seo'

describe('public SEO boundaries', () => {
  it('uses the fixed site origin and removes query, fragment and trailing slash', () => {
    expect(canonicalUrl('/learn/javascript-values/?step=quiz#answers')).toBe(
      'https://js-lab.site/learn/javascript-values',
    )
    expect(canonicalUrl('//attacker.invalid/')).toBe(
      'https://js-lab.site/attacker.invalid',
    )
    expect(canonicalUrl('/')).toBe('https://js-lab.site/')
  })
  it('prevents script termination in JSON-LD while preserving the data', () => {
    const value = { name: '</script><img src=x onerror=alert(1)>' }
    const serialized = serializeJsonLd(value)
    expect(serialized).not.toContain('<')
    expect(JSON.parse(serialized)).toEqual(value)
  })
  it('deduplicates sitemap URLs and escapes XML text', () => {
    const result = sitemapXml(['/courses', '/courses', '/a&b'])
    expect(result.match(/<url>/g)).toHaveLength(2)
    expect(result).toContain('/a&amp;b</loc>')
  })
})
