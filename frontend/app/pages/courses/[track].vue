<script setup lang="ts">
import type { Track } from '#shared/types/api'
import { breadcrumb, courseSchema } from '#shared/seo'
const route = useRoute()
const { data, status, error, refresh } = await useFetch<Track[]>(
  '/api/catalog/tracks',
)
if (import.meta.server && error.value)
  throw createError({
    statusCode: 503,
    statusMessage: 'Каталог временно недоступен',
  })
const track = computed(() =>
  data.value?.find((t) => t.id === route.params.track),
)
if (data.value && !track.value)
  throw createError({ statusCode: 404, statusMessage: 'Курс не найден' })
usePageSeo({
  title: () =>
    track.value
      ? `Курс ${track.value.name} бесплатно — теория и практика`
      : 'Курс',
  description: () => track.value?.description,
})
useJsonLd('course', () => (track.value ? courseSchema(track.value) : {}))
useJsonLd('breadcrumbs', () =>
  breadcrumb([
    { name: 'JSlab', path: '/' },
    { name: 'Курсы', path: '/courses' },
    { name: track.value?.name ?? 'Курс', path: route.path },
  ]),
)
const { user } = useSession()
const {
  data: progress,
  status: progressStatus,
  error: progressError,
  refresh: refreshProgress,
} = useProgress()
</script>
<template>
  <div class="container page-content">
    <NuxtLink to="/courses" class="back-link">← Все курсы</NuxtLink
    ><AsyncState :pending="status === 'pending'" :error="error" @retry="refresh"
      ><template v-if="track"
        ><div class="course-hero" :class="`track-${track.color}`">
          <div>
            <p class="eyebrow">{{ track.label }}</p>
            <h1>{{ track.name }}<span class="accent-text">.</span></h1>
            <p>{{ track.description }}</p>
            <div class="course-meta">
              <span
                ><AppIcon name="book" :size="16" />{{
                  track.lessonCount
                }}
                тем</span
              ><span
                ><AppIcon name="clock" :size="16" />{{
                  Math.round((track.minutes / 60) * 10) / 10
                }}
                ч практики и теории</span
              ><span>{{ track.level }}</span>
            </div>
            <NuxtLink
              v-if="track.lessons[0]"
              :to="`/learn/${track.lessons[0].id}`"
              class="button"
              >Начать курс <AppIcon name="right" :size="18"
            /></NuxtLink>
          </div>
          <span class="course-symbol" aria-hidden="true">{{ track.mark }}</span>
        </div>
        <div class="curriculum-heading">
          <h2>Программа курса</h2>
          <span>{{ track.lessons.length }} шагов к новому навыку</span>
        </div>
        <div class="status-legend" aria-label="Состояния тем">
          <StudyStatus status="not-started" />
          <StudyStatus status="in-progress" />
          <StudyStatus status="completed" />
        </div>
        <p v-if="user && progressStatus === 'pending'" role="status">
          Загружаем прогресс…
        </p>
        <p
          v-if="user && progressError"
          class="progress-load-error"
          role="alert"
        >
          Не удалось загрузить прогресс.
          <button class="text-link" @click="refreshProgress()">
            Повторить
          </button>
        </p>
        <div class="lesson-list">
          <NuxtLink
            v-for="(lesson, index) in track.lessons"
            :key="lesson.id"
            :to="`/learn/${lesson.id}`"
            class="lesson-row"
            ><span
              class="lesson-index"
              :class="{
                done: isLessonComplete(lesson.id, progress?.completed ?? []),
              }"
              ><AppIcon
                v-if="isLessonComplete(lesson.id, progress?.completed ?? [])"
                name="check"
                :size="18"
              /><template v-else>{{
                String(index + 1).padStart(2, '0')
              }}</template></span
            >
            <div>
              <h3>{{ lesson.title }}</h3>
              <p>{{ lesson.summary }}</p>
              <LessonProgress
                v-if="!user || progress"
                :id="lesson.id"
                :progress="progress"
              />
            </div>
            <span class="lesson-duration">{{ lesson.minutes }} мин</span
            ><AppIcon name="arrow" :size="20"
          /></NuxtLink>
        </div>
        <p v-if="!user" class="course-registration">
          Хочешь сохранить результат?
          <NuxtLink to="/auth/register">Создай аккаунт</NuxtLink> и собирай XP
          за каждый шаг.
        </p></template
      ></AsyncState
    >
  </div>
</template>
