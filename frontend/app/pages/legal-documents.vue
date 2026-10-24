<script setup lang="ts">
import { LEGAL_LINKS } from '~/utils/legal'
usePageSeo({
  title: 'Правовые документы — JSlab',
  description:
    'Условия использования JSlab, политика конфиденциальности, cookie и согласие на обработку данных.',
})
</script>
<template>
  <div class="container documents-page">
    <p class="eyebrow">JSlab / О платформе</p>
    <h1>Правовые документы</h1>
    <p>Условия использования платформы и информация о ваших данных.</p>
    <nav class="documents-grid" aria-label="Документы платформы">
      <NuxtLink
        v-for="link in LEGAL_LINKS"
        :key="link.href"
        :to="link.href"
        class="document-card"
      >
        <AppIcon :name="link.icon" :size="24" />
        <h2>{{ link.title }}</h2>
        <AppIcon name="arrow" />
      </NuxtLink>
    </nav>
  </div>
</template>
<style scoped>
.documents-page {
  padding-block: 4rem 5rem;
  min-height: 65vh;
}
h1 {
  margin-block: 1.5rem;
  font-size: clamp(2rem, 5vw, 3.5rem);
}
p {
  color: var(--muted);
}
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: 1rem;
  margin-top: 2.5rem;
}
.document-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  color: var(--ink);
  text-decoration: none;
}
.document-card:hover {
  border-color: var(--accent);
}
h2 {
  flex: 1;
  font-size: 1rem;
}
</style>
