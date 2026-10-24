<script setup lang="ts">
import type { Track } from '#shared/types/api'
useSeoMeta({
  title: 'Курсы',
  description:
    'Последовательный маршрут: JavaScript, TypeScript, Express и NestJS.',
})
const { data, status, error, refresh } = await useFetch<Track[]>(
  '/api/catalog/tracks',
)
</script>
<template>
  <div class="container page-content">
    <p class="eyebrow"><span class="accent-line" />Твой маршрут в разработку</p>
    <div class="page-heading">
      <h1>
        От основ —<br /><span class="accent-text">к целому приложению.</span>
      </h1>
      <p>
        Начни с JavaScript или выбери направление,<br />которое нужно тебе
        сейчас. Все темы доступны.
      </p>
    </div>
    <AsyncState :pending="status === 'pending'" :error="error" @retry="refresh"
      ><div class="tracks-grid">
        <TrackCard
          v-for="(track, index) in data"
          :key="track.id"
          :track="track"
          :index="index"
        />
      </div>
      <div class="route-note">
        <AppIcon name="branch" />
        <div>
          <h3>Рекомендуемый порядок</h3>
          <p>
            JavaScript → TypeScript → Express → NestJS. Открывай теорию без
            аккаунта. Для сохранения прогресса и XP понадобится регистрация.
          </p>
        </div>
      </div></AsyncState
    >
  </div>
</template>
