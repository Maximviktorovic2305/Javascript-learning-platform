<script setup lang="ts">
import { LEGAL_LINKS } from "~/utils/legal";
</script>
<template>
  <nav class="legal-links" aria-label="Правовые документы">
    <NuxtLink
      v-for="link in LEGAL_LINKS"
      :key="link.href"
      :to="link.href"
      class="text-link"
      >{{ link.title }}</NuxtLink
    >
  </nav>
</template>
<style scoped>
.legal-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.5rem;
  padding: 1.5rem 0;
  font-size: 0.75rem;
}
</style>
