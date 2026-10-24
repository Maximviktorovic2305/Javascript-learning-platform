<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
useSeoMeta({ title: 'Страница недоступна', robots: 'noindex, nofollow' })
</script>
<template>
  <NuxtLayout
    ><div class="container error-page">
      <span class="eyebrow">{{ error.statusCode }}</span>
      <h1>
        {{
          error.statusCode === 404
            ? 'Кажется, здесь ещё нет кода.'
            : 'Что-то пошло не по плану.'
        }}
      </h1>
      <p>
        {{
          error.statusCode === 404
            ? 'Такой страницы нет. Вернись к курсам и продолжи маршрут.'
            : 'Попробуй обновить страницу чуть позже.'
        }}
      </p>
      <button class="button" @click="clearError({ redirect: '/courses' })">
        Открыть курсы<AppIcon name="arrow" />
      </button></div
  ></NuxtLayout>
</template>
