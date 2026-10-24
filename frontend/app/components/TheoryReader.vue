<script setup lang="ts">
import type { Lesson } from '#shared/types/api'
const props = defineProps<{ lesson: Lesson }>()
const anchor = (index: number) => `theory-${props.lesson.id}-${index + 1}`
const languageLabels: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  html: 'HTML',
  json: 'JSON',
  bash: 'Терминал',
  sh: 'Терминал',
  sql: 'SQL',
  prisma: 'Prisma schema',
  css: 'CSS',
}
const codeLabel = (language?: string) =>
  languageLabels[language ?? 'javascript'] ?? language
</script>
<template>
  <article class="theory-reader">
    <div v-if="lesson.objectives?.length" class="theory-intro-card">
      <span class="eyebrow">После этой главы</span>
      <ul>
        <li v-for="goal in lesson.objectives" :key="goal">{{ goal }}</li>
      </ul>
      <p v-if="lesson.readingMinutes" class="muted">
        Около {{ lesson.readingMinutes }} минут на чтение и разбор примеров.
        Практика — отдельно, в своём темпе.
      </p>
    </div>
    <nav class="theory-toc" aria-label="Содержание главы">
      <h2>В этой главе</h2>
      <ol>
        <li v-for="(section, index) in lesson.sections" :key="index">
          <a :href="`#${anchor(index)}`">{{ section.title }}</a>
        </li>
      </ol>
    </nav>
    <section
      v-for="(section, index) in lesson.sections"
      :id="anchor(index)"
      :key="index"
      class="theory-section"
    >
      <h2>
        <a :href="`#${anchor(index)}`">{{ section.title }}</a>
      </h2>
      <template v-if="section.blocks">
        <template
          v-for="(block, blockIndex) in section.blocks"
          :key="blockIndex"
        >
          <p v-if="block.type === 'paragraph'">{{ block.text }}</p>
          <ul v-else-if="block.type === 'list'">
            <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
              {{ item }}
            </li>
          </ul>
          <figure v-else-if="block.type === 'code'" class="theory-example">
            <figcaption>
              {{ codeLabel(block.language) }}
            </figcaption>
            <pre
              class="theory-code"
              tabindex="0"
              aria-label="Пример кода"
            ><code>{{ block.text }}</code></pre>
          </figure>
          <div v-else-if="block.type === 'output'" class="theory-output">
            <span>Результат</span>
            <pre>{{ block.text }}</pre>
          </div>
        </template>
      </template>
      <template v-else>
        <p>{{ section.text }}</p>
        <pre
          v-if="section.code"
          class="theory-code"
        ><code>{{ section.code }}</code></pre>
        <div v-if="section.output" class="theory-output">
          <span>Результат</span>
          <pre>{{ section.output }}</pre>
        </div>
      </template>
    </section>
  </article>
</template>
