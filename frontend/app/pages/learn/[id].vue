<script setup lang="ts">
import type { Lesson, Track } from '#shared/types/api'
import { breadcrumb, canonicalUrl, PUBLISHER } from '#shared/seo'
const route = useRoute()
definePageMeta({ key: (route) => route.params.id as string })
const id = String(route.params.id)
const {
  data: lesson,
  status,
  error,
  refresh,
} = await useFetch<Lesson>(`/api/catalog/lessons/${encodeURIComponent(id)}`)
if (error.value?.statusCode === 404)
  throw createError({ statusCode: 404, statusMessage: 'Тема не найдена' })
if (import.meta.server && error.value)
  throw createError({
    statusCode: 503,
    statusMessage: 'Урок временно недоступен',
  })
const { data: tracks } = await useFetch<Track[]>('/api/catalog/tracks')
const track = computed(() =>
  tracks.value?.find((t) => t.id === lesson.value?.trackId),
)
const current = computed(
  () => track.value?.lessons.findIndex((l) => l.id === id) ?? -1,
)
const next = computed(() => track.value?.lessons[current.value + 1])
const tab = ref<'theory' | 'practice' | 'quiz'>('theory')
const { user } = useSession()
const {
  data: progress,
  status: progressStatus,
  error: progressError,
  refresh: refreshProgress,
} = useProgress()
const api = useApi()
const reading = ref(false)
const message = ref('')
const readError = ref('')
usePageSeo({
  title: () =>
    lesson.value
      ? `${lesson.value.title} — ${track.value?.name ?? 'Урок'}`
      : 'Урок',
  description: () => lesson.value?.summary,
})
useJsonLd('lesson', () =>
  lesson.value
    ? {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: lesson.value.title,
        description: lesson.value.summary,
        url: canonicalUrl(`/learn/${id}`),
        inLanguage: 'ru',
        isAccessibleForFree: true,
        learningResourceType: 'Урок с практикой и тестами',
        provider: PUBLISHER,
        isPartOf: {
          '@type': 'Course',
          '@id': `${canonicalUrl(`/courses/${lesson.value.trackId}`)}#course`,
          name: `Курс ${track.value?.name ?? lesson.value.trackId}`,
        },
      }
    : {},
)
useJsonLd('breadcrumbs', () =>
  breadcrumb([
    { name: 'JSlab', path: '/' },
    { name: 'Курсы', path: '/courses' },
    {
      name: track.value?.name ?? 'Курс',
      path: `/courses/${lesson.value?.trackId ?? 'javascript'}`,
    },
    { name: lesson.value?.title ?? 'Урок', path: `/learn/${id}` },
  ]),
)
watch(
  () => route.query.step,
  (value) => {
    if (value === 'practice' || value === 'quiz') tab.value = value
  },
  { immediate: true },
)
async function read() {
  if (!user.value) {
    await navigateTo('/auth/login')
    return
  }
  reading.value = true
  const owner = user.value.id
  readError.value = ''
  try {
    const result = await api<{ xp: number }>(`/learning/${id}/read`, {
      method: 'POST',
    })
    if (user.value?.id !== owner) return
    message.value = result.xp
      ? `Теория изучена. +${result.xp} XP`
      : 'Теория уже отмечена'
    await refreshNuxtData(`private:progress:${owner}`)
    tab.value = 'practice'
  } catch (e) {
    readError.value = errorMessage(e)
  } finally {
    reading.value = false
  }
}
</script>
<template>
  <div class="container page-content lesson-page">
    <AsyncState :pending="status === 'pending'" :error="error" @retry="refresh"
      ><template v-if="lesson"
        ><div class="lesson-breadcrumb">
          <NuxtLink to="/courses">Курсы</NuxtLink
          ><AppIcon name="chevron" :size="14" /><NuxtLink
            :to="`/courses/${lesson.trackId}`"
            >{{ track?.name }}</NuxtLink
          ><AppIcon name="chevron" :size="14" /><span
            >Тема {{ current + 1 }}</span
          >
        </div>
        <div class="lesson-heading">
          <div>
            <p class="eyebrow">
              {{ track?.name }} <span class="dot-divider">/</span>
              {{ lesson.minutes }} минут
            </p>
            <h1>{{ lesson.title }}</h1>
            <p>{{ lesson.summary }}</p>
            <LessonProgress
              v-if="!user || progress"
              :id="id"
              :progress="progress"
              current
            />
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
          </div>
          <span class="lesson-count"
            >{{ String(current + 1).padStart(2, '0')
            }}<span> / {{ track?.lessonCount }}</span></span
          >
        </div>
        <div class="lesson-layout">
          <aside class="lesson-sidebar">
            <p class="eyebrow">В этом курсе</p>
            <nav aria-label="Темы курса">
              <NuxtLink
                v-for="(topic, index) in track?.lessons"
                :key="topic.id"
                :to="`/learn/${topic.id}`"
                :class="{ active: topic.id === id }"
                ><span>{{ String(index + 1).padStart(2, '0') }}</span
                >{{ topic.title }}
                <AppIcon
                  v-if="isLessonComplete(topic.id, progress?.completed ?? [])"
                  class="topic-complete"
                  name="check"
                  :size="14"
                  aria-label="Тема завершена"
                />
              </NuxtLink>
            </nav>
            <div class="lesson-xp">
              <AppIcon name="zap" />
              <p>До 90 XP за тему<small>Теория + практика + тест</small></p>
            </div>
          </aside>
          <div class="lesson-main">
            <div class="tabs" role="tablist" aria-label="Этап урока">
              <button
                id="tab-theory"
                role="tab"
                :aria-selected="tab === 'theory'"
                aria-controls="lesson-panel"
                :class="{ active: tab === 'theory' }"
                @click="tab = 'theory'"
              >
                <span>01</span>Теория
                <StudyStatus
                  v-if="!user || progress"
                  :status="stepStatus(id, 'theory', progress, tab === 'theory')"
                  :label="
                    stepStatus(id, 'theory', progress) === 'completed'
                      ? 'Изучена'
                      : undefined
                  "
                /></button
              ><button
                id="tab-practice"
                role="tab"
                :aria-selected="tab === 'practice'"
                aria-controls="lesson-panel"
                :class="{ active: tab === 'practice' }"
                @click="tab = 'practice'"
              >
                <span>02</span>Практика
                <StudyStatus
                  v-if="!user || progress"
                  :status="
                    stepStatus(id, 'practice', progress, tab === 'practice')
                  "
                  :label="
                    stepStatus(id, 'practice', progress) === 'completed'
                      ? 'Решена'
                      : undefined
                  "
                /></button
              ><button
                id="tab-quiz"
                role="tab"
                :aria-selected="tab === 'quiz'"
                aria-controls="lesson-panel"
                :class="{ active: tab === 'quiz' }"
                @click="tab = 'quiz'"
              >
                <span>03</span>Тест
                <StudyStatus
                  v-if="!user || progress"
                  :status="stepStatus(id, 'quiz', progress, tab === 'quiz')"
                  :label="
                    stepStatus(id, 'quiz', progress) === 'completed'
                      ? 'Пройден'
                      : undefined
                  "
                />
              </button>
            </div>
            <div
              id="lesson-panel"
              role="tabpanel"
              :aria-labelledby="`tab-${tab}`"
            >
              <div v-show="tab === 'theory'" class="theory-content">
                <TheoryReader :lesson="lesson" />
                <p v-if="readError" class="error-text" role="alert">
                  {{ readError }}
                </p>
                <button class="button" :disabled="reading" @click="read">
                  {{
                    reading
                      ? 'Сохраняем…'
                      : stepStatus(id, 'theory', progress) === 'completed'
                        ? 'Теория изучена. К практике'
                        : 'Теория понятна. К практике'
                  }}<AppIcon name="right" :size="18" />
                </button>
              </div>
              <div v-show="tab === 'practice'">
                <p v-if="message" class="success-text" role="status">
                  {{ message }}
                </p>
                <ClientOnly
                  ><CodeWorkspace :exercise="lesson.exercise" /><template
                    #fallback
                    ><div class="state-panel">
                      Загружаем редактор…
                    </div></template
                  ></ClientOnly
                >
                <div class="lesson-next-step">
                  <button class="text-link" @click="tab = 'quiz'">
                    Перейти к тесту<AppIcon name="right" :size="18" />
                  </button>
                </div>
              </div>
              <LessonQuiz v-if="tab === 'quiz'" :lesson="lesson" />
            </div>
            <div v-if="next" class="next-lesson">
              <span>Следующая тема</span
              ><NuxtLink :to="`/learn/${next.id}`"
                >{{ next.title }}<AppIcon name="arrow"
              /></NuxtLink>
            </div>
            <div v-else class="next-lesson">
              <span>Ты дошёл до конца раздела</span
              ><NuxtLink to="/projects"
                >Закрепить знания в проекте <AppIcon name="arrow"
              /></NuxtLink>
            </div>
          </div></div></template
    ></AsyncState>
  </div>
</template>
