import type { MaybeRefOrGetter } from 'vue'
import { canonicalUrl, SITE_DESCRIPTION, SITE_URL } from '#shared/seo'

export function usePageSeo(options: {
  title: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string | undefined>
  robots?: string
}) {
  const route = useRoute()
  const title = () => toValue(options.title)
  const description = () => toValue(options.description) ?? SITE_DESCRIPTION
  useSeoMeta({
    title,
    description,
    ogTitle: () => `${title()} · JSlab`,
    ogDescription: description,
    ogUrl: () => canonicalUrl(route.path),
    ogType: 'website',
    ogSiteName: 'JSlab',
    ogLocale: 'ru_RU',
    ogImage: `${SITE_URL}/social-preview.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'JSlab — бесплатные курсы JavaScript и TypeScript',
    twitterCard: 'summary_large_image',
    twitterTitle: () => `${title()} · JSlab`,
    twitterDescription: description,
    twitterImage: `${SITE_URL}/social-preview.png`,
    robots: () =>
      options.robots ??
      (/^\/(auth|dashboard|profile)(\/|$)/.test(route.path)
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large'),
  })
  useHead(() => ({
    link: [
      { key: 'canonical', rel: 'canonical', href: canonicalUrl(route.path) },
    ],
  }))
}
