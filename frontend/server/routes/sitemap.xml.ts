import type { Track } from '../../shared/types/api'
import { sitemapXml } from '../../shared/seo'

export default defineEventHandler(async (event) => {
  const { apiBase } = useRuntimeConfig(event)
  const tracks = await $fetch<Track[]>(`${apiBase}/api/catalog/tracks`, {
    timeout: 5000,
  }).catch(() => null)
  if (
    !Array.isArray(tracks) ||
    tracks.length !== 4 ||
    tracks.some(
      (track) =>
        !['javascript', 'typescript', 'express', 'nest'].includes(track.id) ||
        !Array.isArray(track.lessons) ||
        track.lessons.some((lesson) => !/^[a-z0-9-]+$/.test(lesson.id)),
    )
  ) {
    setResponseHeader(event, 'Retry-After', 60)
    throw createError({
      statusCode: 503,
      statusMessage: 'Sitemap temporarily unavailable',
    })
  }
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=300, stale-while-revalidate=3600',
  )
  return sitemapXml([
    '/',
    '/courses',
    '/practice',
    '/projects',
    '/legal-documents',
    '/private-policy',
    '/cookie-policy',
    '/user-agreement',
    '/data-consent',
    ...tracks.flatMap((track) => [
      `/courses/${track.id}`,
      ...track.lessons.map((lesson) => `/learn/${lesson.id}`),
    ]),
  ])
})
