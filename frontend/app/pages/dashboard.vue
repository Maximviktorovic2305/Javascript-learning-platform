<script setup lang="ts">
import type { Track } from '#shared/types/api'
definePageMeta({ layout: 'workspace', middleware: 'auth' })
useSeoMeta({ title: 'Мой кабинет', robots: 'noindex' })
const { user } = useSession()
const { data: progress, status, error, refresh } = useProgress()
const { data: tracks } = await useFetch<Track[]>('/api/catalog/tracks')
const next = computed(() =>
  tracks.value
    ?.flatMap((t) => t.lessons)
    .find((l) => !isLessonComplete(l.id, progress.value?.completed ?? [])),
)
const nextHref = computed(() =>
  next.value
    ? `/learn/${next.value.id}?step=${lessonStage(next.value.id, progress.value?.completed ?? [])}`
    : '/projects',
)
const percent = computed(() =>
  Math.min(
    100,
    Math.round(
      ((progress.value?.todayXp ?? 0) / (user.value?.dailyGoal ?? 50)) * 100,
    ),
  ),
)
const activeDays = computed(() => {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone: user.value?.timezone ?? 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const today = format.format(new Date())
  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - (27 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      day: key,
      xp: progress.value?.activity.find((a) => a.day === key)?.xp ?? 0,
    }
  })
})
</script>
<template>
  <p class="eyebrow">Твой личный маршрут</p>
  <div class="dashboard-greeting">
    <div>
      <h1>Привет, {{ user?.name }}<span class="accent-text">.</span></h1>
      <p>Новая строчка кода — ещё один шаг вперёд.</p>
    </div>
    <span class="level-badge"
      ><AppIcon name="zap" :size="17" />Уровень {{ progress?.level ?? 1 }}</span
    >
  </div>
  <AsyncState :pending="status === 'pending'" :error="error" @retry="refresh"
    ><template v-if="progress"
      ><div class="stats-grid">
        <article>
          <AppIcon name="zap" /><strong>{{
            progress.xp.toLocaleString('ru')
          }}</strong
          ><span>Всего XP</span>
        </article>
        <article>
          <AppIcon name="flame" /><strong>{{ progress.streak }}</strong
          ><span>Дней подряд</span>
        </article>
        <article>
          <AppIcon name="code" /><strong>{{ progress.solved }}</strong
          ><span>Задач решено</span>
        </article>
        <article>
          <AppIcon name="check" /><strong>{{ progress.quizzes }}</strong
          ><span>Тестов пройдено</span>
        </article>
      </div>
      <div class="dashboard-panels">
        <div class="continue-card">
          <p class="eyebrow">
            <span class="live-dot" />Продолжай с того же места
          </p>
          <h2>{{ next?.title ?? 'Все темы изучены!' }}</h2>
          <p>
            {{
              next?.summary ??
              'Отличный момент, чтобы закрепить знания в проекте.'
            }}
          </p>
          <NuxtLink :to="nextHref" class="button"
            >{{ next ? 'Продолжить обучение' : 'К проектам'
            }}<AppIcon name="arrow" :size="18" /></NuxtLink
          ><span class="continue-decoration" aria-hidden="true">{ }</span>
        </div>
        <div class="daily-card">
          <div class="card-title">
            <h3>Дневная цель</h3>
            <AppIcon name="target" />
          </div>
          <div class="daily-progress">
            <strong
              >{{ progress.todayXp
              }}<span> / {{ user?.dailyGoal }} XP</span></strong
            ><span>{{ percent }}%</span>
          </div>
          <div
            class="progress-bar"
            role="progressbar"
            :aria-valuenow="percent"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Дневная цель"
          >
            <i :style="{ width: `${percent}%` }" />
          </div>
          <p>
            {{
              percent >= 100
                ? 'Цель выполнена. Отличная работа!'
                : 'Одна задача сегодня — инвестиция в себя завтра.'
            }}
          </p>
          <NuxtLink to="/profile" class="text-link"
            >Изменить цель<AppIcon name="chevron" :size="15"
          /></NuxtLink>
        </div>
      </div>
      <div class="dashboard-section-heading">
        <h2>Твои направления</h2>
        <NuxtLink to="/courses" class="text-link"
          >Все курсы<AppIcon name="arrow" :size="17"
        /></NuxtLink>
      </div>
      <div class="dashboard-course-list">
        <NuxtLink
          v-for="track in tracks"
          :key="track.id"
          :to="`/courses/${track.id}`"
          :class="`track-${track.color}`"
          ><span class="track-mark">{{ track.mark }}</span>
          <div>
            <h3>{{ track.name }}</h3>
            <p>
              {{
                track.lessons.filter(
                  (l) =>
                    progress?.completed.includes(`theory:${l.id}`) &&
                    progress?.completed.includes(`practice:${l.id}`) &&
                    progress?.completed.includes(`quiz:${l.id}`),
                ).length
              }}
              из {{ track.lessonCount }} тем завершено
            </p>
          </div>
          <AppIcon name="arrow"
        /></NuxtLink>
      </div>
      <div class="dashboard-panels">
        <div class="activity-card">
          <div class="card-title">
            <h3>Код каждый день</h3>
            <span>Последние 28 дней</span>
          </div>
          <div class="activity-grid">
            <span
              v-for="day in activeDays"
              :key="day.day"
              :class="{ active: day.xp > 0, strong: day.xp >= 100 }"
              :title="`${day.day}: ${day.xp} XP`"
              :aria-label="`${day.day}: ${day.xp} XP`"
              role="img"
            />
          </div>
          <p>Серия учитывает часовой пояс {{ user?.timezone }}.</p>
        </div>
        <div class="achievement-card">
          <div class="card-title">
            <h3>Достижения</h3>
            <AppIcon name="trophy" />
          </div>
          <div
            v-for="achievement in progress.achievements.slice(0, 3)"
            :key="achievement.id"
            class="achievement-row"
            :class="{ unlocked: achievement.unlocked }"
          >
            <AppIcon
              :name="achievement.unlocked ? 'trophy' : 'lock'"
              :size="18"
            />
            <div>
              <strong>{{ achievement.title }}</strong
              ><small>{{ achievement.description }}</small>
            </div>
          </div>
        </div>
      </div></template
    ></AsyncState
  >
</template>
