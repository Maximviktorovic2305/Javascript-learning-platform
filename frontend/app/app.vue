<script setup lang="ts">
useTheme()
usePageSeo({ title: 'JavaScript и TypeScript бесплатно' })
useJsonLd('site', {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://js-lab.site/#website',
      name: 'JSlab',
      url: 'https://js-lab.site/',
      inLanguage: 'ru',
    },
    {
      '@type': 'Organization',
      '@id': 'https://js-lab.site/#publisher',
      name: 'JSlab',
      url: 'https://js-lab.site/',
      logo: 'https://js-lab.site/js-logo.svg',
      founder: {
        '@type': 'Person',
        name: 'Максим Викторович',
        url: 'https://itmyportfolio.site/',
      },
    },
  ],
})
const route = useRoute()
const privatePage = computed(() =>
  /^\/(auth|profile|dashboard)(\/|$)/.test(route.path),
)
</script>
<template>
  <NuxtLoadingIndicator color="#c7f55b" />
  <NuxtLayout
    ><div class="analytics-page" :class="{ 'ym-hide-content': privatePage }">
      <NuxtPage /></div
  ></NuxtLayout>
</template>
<style>
.analytics-page {
  display: contents;
}
</style>
