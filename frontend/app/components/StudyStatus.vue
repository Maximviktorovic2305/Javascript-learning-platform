<script setup lang="ts">
import type { StudyStatus } from '~/utils/lessonProgress'
defineProps<{ status: StudyStatus; label?: string }>()
const labels = {
  'not-started': 'Не начата',
  'in-progress': 'В процессе',
  completed: 'Завершена',
}
</script>
<template>
  <span class="study-status" :data-status="status">
    <AppIcon v-if="status === 'completed'" name="check" :size="13" />
    <AppIcon v-else-if="status === 'in-progress'" name="clock" :size="13" />
    <i v-else aria-hidden="true" />
    {{ label ?? labels[status] }}
  </span>
</template>
