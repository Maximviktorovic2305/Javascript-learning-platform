import type { Track } from './types/api'

export const SITE_URL = 'https://js-lab.site'
export const SITE_DESCRIPTION =
  'Бесплатные курсы JavaScript, TypeScript, Express и NestJS: подробная теория, практика с проверкой кода, тесты и личный прогресс.'
export const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#publisher`,
  name: 'JSlab',
  url: SITE_URL,
}

export function canonicalUrl(path = '/') {
  const pathname = path.split(/[?#]/)[0] ?? '/'
  return `${SITE_URL}/${pathname.replace(/^\/+|\/+$/g, '')}`
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  }
}

export function courseSchema(track: Track) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${canonicalUrl(`/courses/${track.id}`)}#course`,
    name: `Курс ${track.name}`,
    description: track.description,
    url: canonicalUrl(`/courses/${track.id}`),
    inLanguage: 'ru',
    isAccessibleForFree: true,
    educationalLevel: track.level,
    provider: PUBLISHER,
    teaches: track.lessons.map((lesson) => lesson.title),
  }
}

export function sitemapXml(paths: string[]) {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&apos;',
        })[char]!,
    )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map((path) => `<url><loc>${escape(canonicalUrl(path))}</loc></url>`).join('')}</urlset>`
}
