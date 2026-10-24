import type { MaybeRefOrGetter } from 'vue'
import { serializeJsonLd } from '#shared/seo'

export function useJsonLd(key: string, value: MaybeRefOrGetter<unknown>) {
  useHead(() => ({
    script: [
      {
        key: `jsonld:${key}`,
        type: 'application/ld+json',
        innerHTML: serializeJsonLd(toValue(value)),
      },
    ],
  }))
}
