<script setup lang="ts">
import { LEGAL_DOCUMENTS } from "~/utils/legal";
const props = defineProps<{ document: keyof typeof LEGAL_DOCUMENTS }>();
const content = computed(() => LEGAL_DOCUMENTS[props.document]);
useSeoMeta({
  title: () => `${content.value.title} — JSlab`,
  description: () => content.value.sections[0].paragraphs[0],
});
</script>
<template>
  <article class="legal-page container">
    <NuxtLink to="/legal-documents" class="text-link"
      >← Правовые документы</NuxtLink
    >
    <h1>{{ content.title }}</h1>
    <p class="legal-date">Редакция от 24 октября 2026 года</p>
    <section v-for="section in content.sections" :key="section.title">
      <h2>{{ section.title }}</h2>
      <p v-for="paragraph in section.paragraphs" :key="paragraph">
        {{ paragraph }}
      </p>
    </section>
    <LegalLinks />
  </article>
</template>
<style scoped>
.legal-page {
  max-width: 52rem;
  padding-block: 4rem 5rem;
  line-height: 1.8;
}
h1 {
  margin-block: 1.5rem 1rem;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
}
h2 {
  margin: 2.5rem 0 0.75rem;
  font-size: 1.25rem;
}
p {
  margin-block: 0.85rem;
  color: var(--muted);
}
.legal-date {
  font-size: 0.8rem;
}
</style>
