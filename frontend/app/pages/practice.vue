<script setup lang="ts">
import type { ExerciseSummary, TrackId } from '#shared/types/api'
useSeoMeta({
  title: 'Практика',
  description:
    'Задачи на JavaScript и TypeScript, практика Express и NestJS с проверкой решений.',
})
const { data, status, error, refresh } = await useFetch<ExerciseSummary[]>(
  '/api/catalog/exercises',
)
const search = ref('')
const selected = ref<'all' | TrackId>('all')
const state = ref('all')
function resetFilters() {
  search.value = ''
  selected.value = 'all'
  state.value = 'all'
}
const { user } = useSession()
watch(() => user.value?.id, () => { state.value = 'all' })
const {
  data: progress,
  status: progressStatus,
  error: progressError,
  refresh: refreshProgress,
} = useProgress()
const stateOptions = computed(() => [
  { value: 'all', label: 'Все задачи', icon: 'filter' as const },
  {
    value: 'not-started',
    label: 'Не начаты',
    icon: 'book' as const,
    disabled: !progress.value,
  },
  {
    value: 'in-progress',
    label: 'В процессе',
    icon: 'clock' as const,
    disabled: !progress.value,
  },
  {
    value: 'completed',
    label: 'Решены',
    icon: 'check' as const,
    disabled: !progress.value,
  },
])
const tracks = [
  { id: 'all', name: 'Все направления', icon: 'filter' },
  { id: 'javascript', name: 'JavaScript', icon: 'braces' },
  { id: 'typescript', name: 'TypeScript', icon: 'file-code' },
  { id: 'express', name: 'Express', icon: 'server' },
  { id: 'nest', name: 'NestJS', icon: 'layers' },
] as const
const filtered = computed(() =>
  data.value?.filter(
    (exercise) =>
      (selected.value === 'all' || exercise.trackId === selected.value) &&
      `${exercise.title} ${exercise.summary}`
        .toLowerCase()
        .includes(search.value.toLowerCase()) &&
      (state.value === 'all' ||
        (progress.value &&
          stepStatus(exercise.id, 'practice', progress.value) === state.value)),
  ),
)
</script>
<template>
  <div class="container page-content">
    <p class="eyebrow">
      <span class="accent-line" />Навык приходит с практикой
    </p>
    <div class="page-heading">
      <h1>
        Меньше сомнений.<br /><span class="accent-text">Больше кода.</span>
      </h1>
      <p>
        Задачи на конкретные навыки.<br />Пиши решение, проверяй примеры,
        получай XP.
      </p>
    </div>
    <div class="filter-bar">
      <label class="search-input"
        ><AppIcon name="search" :size="18" /><input
          v-model="search"
          type="search"
          placeholder="Найти задачу…"
          aria-label="Поиск задач"
      /></label>
      <div class="select-label">
        Статус
        <AppSelect
          :model-value="state"
          :options="stateOptions"
          label="Статус задач"
          @update:model-value="state = String($event)"
        />
      </div>
    </div>
    <div class="filter-tabs" aria-label="Направление">
      <button
        v-for="track in tracks"
        :key="track.id"
        :class="{ active: selected === track.id }"
        :aria-pressed="selected === track.id"
        @click="selected = track.id"
      >
        <AppIcon :name="track.icon" :size="14" />{{ track.name }}
      </button>
    </div>
    <p v-if="user && progressStatus === 'pending'" role="status">
      Загружаем прогресс…
    </p>
    <p v-if="user && progressError" class="progress-load-error" role="alert">
      Не удалось загрузить прогресс.
      <button class="text-link" @click="refreshProgress()">Повторить</button>
    </p>
    <AsyncState :pending="status === 'pending'" :error="error" @retry="refresh"
      ><div v-if="!filtered?.length" class="state-panel">
        <AppIcon name="search" />
        <p>По этим условиям ничего не найдено.</p>
        <button class="text-link" @click="resetFilters">
          Сбросить фильтры
        </button>
      </div>
      <div v-else class="practice-list">
        <NuxtLink
          v-for="exercise in filtered"
          :key="exercise.id"
          :to="`/learn/${exercise.id}?step=practice`"
          class="practice-row"
          ><span
            class="practice-icon"
            :class="{
              done: progress?.completed.includes(`practice:${exercise.id}`),
            }"
            ><AppIcon
              :name="
                progress?.completed.includes(`practice:${exercise.id}`)
                  ? 'check'
                  : exercise.trackId === 'javascript'
                    ? 'braces'
                    : exercise.trackId === 'typescript'
                      ? 'file-code'
                      : exercise.trackId === 'express'
                        ? 'server'
                        : 'layers'
              "
          /></span>
          <div>
            <div class="practice-row-label">
              <span>{{
                tracks.find((t) => t.id === exercise.trackId)?.name
              }}</span
              ><span v-if="exercise.runtime === 'node'" class="runtime-tag"
                >Node.js</span
              >
            </div>
            <h3>{{ exercise.title }}</h3>
            <p>{{ exercise.summary }}</p>
            <StudyStatus
              v-if="!user || progress"
              :status="stepStatus(exercise.id, 'practice', progress)"
              :label="
                stepStatus(exercise.id, 'practice', progress) === 'completed'
                  ? 'Решена'
                  : undefined
              "
            />
          </div>
          <span class="xp-label">+50 XP</span><AppIcon name="arrow"
        /></NuxtLink></div
    ></AsyncState>
  </div>
</template>
