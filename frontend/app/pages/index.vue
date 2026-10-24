<script setup lang="ts">
import type { Track } from '#shared/types/api'
usePageSeo({
  title: 'JavaScript и TypeScript бесплатно',
  description:
    'Бесплатные курсы JavaScript и TypeScript: полный доступ к программе, практике и проектам без подписок и оплаты. Дополнительные направления — Express и NestJS.',
})
const {
  data: tracks,
  status,
  error,
  refresh,
} = await useFetch<Track[]>('/api/catalog/tracks')
if (import.meta.server && error.value)
  throw createError({
    statusCode: 503,
    statusMessage: 'Каталог временно недоступен',
  })
</script>
<template>
  <HeroScene />
  <div class="tech-band">
    <div class="container tech-band-inner">
      <span class="eyebrow">Один маршрут. Весь стек.</span
      ><span><b class="tech-js">JS</b>JavaScript</span
      ><span><b class="tech-ts">TS</b>TypeScript</span
      ><span><b class="tech-ex">ex</b>Express</span
      ><span><b class="tech-nest">N</b>NestJS</span
      ><span class="band-end"
        >Пиши. Запускай. Понимай.<AppIcon name="terminal" :size="19"
      /></span>
    </div>
  </div>
  <CourseAtlas
    :tracks="tracks ?? []"
    :pending="status === 'pending'"
    :error="error"
    @retry="refresh"
  />
  <section class="section section-border">
    <div class="container learning-section">
      <div class="learning-copy">
        <p class="eyebrow">
          <span class="accent-line" />Знания становятся навыком
        </p>
        <h2>
          Понял.<br />Написал.<br /><span class="accent-text">Получилось.</span>
        </h2>
        <p class="body-copy">
          Никаких бесконечных видео. Разбирай короткую тему, пиши решение и
          сразу проверяй себя. Ошибки — часть маршрута.
        </p>
        <NuxtLink to="/practice" class="text-link"
          >Попробовать практику <AppIcon name="arrow" :size="18"
        /></NuxtLink>
      </div>
      <div class="demo-editor">
        <div class="editor-top">
          <span class="window-dots"><i /><i /><i /></span
          ><span>first-step.js</span><span class="editor-lang">JavaScript</span>
        </div>
        <div class="demo-code">
          <span class="code-comment">// Большие проекты начинаются здесь</span
          ><br /><span class="code-purple">const</span> skills = [<span
            class="code-green"
            >'любопытство'</span
          >];<br /><br /><span class="code-purple">function</span>
          <span class="code-blue">learn</span>(skill) {<br />&nbsp; skills.<span
            class="code-blue"
            >push</span
          >(skill);<br />&nbsp;
          <span class="code-purple">return</span>
          skills;<br />}<br /><br />console.<span class="code-blue">log</span
          >(<span class="code-blue">learn</span>(<span class="code-green"
            >'JavaScript'</span
          >));<span class="code-caret" />
        </div>
        <div class="demo-output">
          <AppIcon name="terminal" :size="15" /><span
            >['любопытство', 'JavaScript']</span
          ><span class="demo-success"
            ><AppIcon name="check" :size="14" />Всё получилось</span
          >
        </div>
        <div class="editor-float">
          <span class="float-icon"><AppIcon name="zap" /></span>
          <div><strong>+50 XP</strong><small>Ещё один шаг вперёд</small></div>
        </div>
      </div>
    </div>
  </section>
</template>
