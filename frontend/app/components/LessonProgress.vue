<script setup lang="ts">
import type { Progress } from '#shared/types/api'
import type { StudyStep } from '~/utils/lessonProgress'
defineProps<{ id: string; progress?: Progress | null; current?: boolean }>()
const steps: { id: StudyStep; name: string; done: string }[] = [
  { id: 'theory', name: 'Теория', done: 'изучена' },
  { id: 'practice', name: 'Практика', done: 'решена' },
  { id: 'quiz', name: 'Тест', done: 'пройден' },
]
</script>
<template>
  <div class="lesson-progress-summary" aria-label="Прогресс темы">
    <StudyStatus :status="lessonStatus(id, progress, current)" />
    <span
      v-for="step in steps"
      :key="step.id"
      class="lesson-step-summary"
      :data-status="stepStatus(id, step.id, progress)"
    >
      <AppIcon
        v-if="stepStatus(id, step.id, progress) === 'completed'"
        name="check"
        :size="12"
      />
      {{ step.name }}:
      {{
        stepStatus(id, step.id, progress) === 'completed'
          ? step.done
          : stepStatus(id, step.id, progress) === 'in-progress'
            ? 'в процессе'
            : 'впереди'
      }}
    </span>
  </div>
</template>
