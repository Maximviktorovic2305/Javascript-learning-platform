<script setup lang="ts">
useTheme()
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
