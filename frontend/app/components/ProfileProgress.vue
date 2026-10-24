<script setup lang="ts">
import type { Progress, Track } from '#shared/types/api'
const props = defineProps<{
  progress: Progress
  tracks: Track[]
  timezone: string
}>()
const allLessons = computed(() =>
  props.tracks.flatMap((track) => track.lessons),
)
const finished = computed(
  () =>
    allLessons.value.filter(
      (lesson) => lessonStatus(lesson.id, props.progress) === 'completed',
    ).length,
)
const inProgress = computed(
  () =>
    allLessons.value.filter(
      (lesson) => lessonStatus(lesson.id, props.progress) === 'in-progress',
    ).length,
)
const nextLevelXp = computed(() => props.progress.level * 500)
const levelPercent = computed(() => Math.round((props.progress.xp % 500) / 5))
const counts = (track: Track, step: 'theory' | 'practice' | 'quiz') =>
  track.lessons.filter(
    (lesson) => stepStatus(lesson.id, step, props.progress) === 'completed',
  ).length
const completedTopics = (track: Track) =>
  track.lessons.filter(
    (lesson) => lessonStatus(lesson.id, props.progress) === 'completed',
  ).length
const trackPercent = (track: Track) =>
  track.lessonCount
    ? Math.round(
        ((counts(track, 'theory') +
          counts(track, 'practice') +
          counts(track, 'quiz')) /
          (track.lessonCount * 3)) *
          100,
      )
    : 0
const days = computed(() => {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: props.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - (27 - index))
    const day = date.toISOString().slice(0, 10)
    return {
      day,
      xp: props.progress.activity.find((item) => item.day === day)?.xp ?? 0,
    }
  })
})
const activeDays = computed(() => days.value.filter((day) => day.xp > 0).length)
</script>
<template>
  <section class="profile-learning" aria-label="Прогресс обучения">
    <div class="profile-level-card">
      <div>
        <span class="eyebrow">Твой опыт</span>
        <h2>Уровень {{ progress.level }}</h2>
        <p>
          {{ progress.xp.toLocaleString('ru') }} XP · до следующего уровня
          {{ nextLevelXp - progress.xp }} XP
        </p>
      </div>
      <AppIcon name="zap" :size="32" />
      <div
        class="progress-bar"
        role="progressbar"
        :aria-valuenow="levelPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Прогресс текущего уровня"
      >
        <i :style="{ width: `${levelPercent}%` }" />
      </div>
    </div>
    <div class="stats-grid profile-statistics">
      <article>
        <AppIcon name="book" /><strong
          >{{ finished }}<small> / {{ allLessons.length }}</small></strong
        ><span>Тем завершено</span>
      </article>
      <article>
        <AppIcon name="clock" /><strong>{{ inProgress }}</strong
        ><span>Тем в процессе</span>
      </article>
      <article>
        <AppIcon name="code" /><strong>{{ progress.solved }}</strong
        ><span>Задач решено</span>
      </article>
      <article>
        <AppIcon name="success" /><strong>{{ progress.quizzes }}</strong
        ><span>Тестов пройдено</span>
      </article>
    </div>
    <section class="settings-card">
      <div class="profile-section-heading">
        <h2>Прогресс по направлениям</h2>
        <AppIcon name="branch" />
      </div>
      <p>Процент учитывает три этапа каждой темы: теорию, практику и тест.</p>
      <div class="profile-tracks">
        <NuxtLink
          v-for="track in tracks"
          :key="track.id"
          :to="`/courses/${track.id}`"
          class="profile-track"
        >
          <div class="profile-track-heading">
            <h3>{{ track.name }}</h3>
            <strong>{{ trackPercent(track) }}%</strong>
          </div>
          <div
            class="progress-bar"
            role="progressbar"
            :aria-valuenow="trackPercent(track)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Прогресс курса ${track.name}`"
          >
            <i :style="{ width: `${trackPercent(track)}%` }" />
          </div>
          <div class="profile-track-counts">
            <span
              >Теория {{ counts(track, 'theory') }}/{{
                track.lessonCount
              }}</span
            ><span
              >Практика {{ counts(track, 'practice') }}/{{
                track.lessonCount
              }}</span
            ><span
              >Тесты {{ counts(track, 'quiz') }}/{{ track.lessonCount }}</span
            >
          </div>
          <p>
            {{ completedTopics(track) }} из {{ track.lessonCount }} тем
            завершено <AppIcon name="arrow" :size="14" />
          </p>
        </NuxtLink>
      </div>
    </section>
    <section class="settings-card">
      <div class="profile-section-heading">
        <h2>Последние 28 дней</h2>
        <AppIcon name="calendar" />
      </div>
      <p>
        {{ activeDays }} активных дней · серия {{ progress.streak }} дней ·
        сегодня {{ progress.todayXp }} XP
      </p>
      <ol class="profile-activity" aria-label="Активность по дням">
        <li
          v-for="day in days"
          :key="day.day"
          :class="{ active: day.xp > 0, intense: day.xp >= 90 }"
          :title="`${day.day}: ${day.xp} XP`"
        >
          <span>{{ day.day }}: {{ day.xp }} XP</span>
        </li>
      </ol>
      <p class="profile-activity-note">
        Даты учитывают часовой пояс {{ timezone }}. Активный день — день, в
        который получен опыт.
      </p>
    </section>
  </section>
</template>
