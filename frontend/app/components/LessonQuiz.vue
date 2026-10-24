<script setup lang="ts">
import type { Lesson, QuizResult } from '#shared/types/api'
const props = defineProps<{ lesson: Lesson }>()
const answers = ref<number[]>(props.lesson.questions.map(() => -1))
const result = ref<QuizResult | null>(null)
const busy = ref(false)
const error = ref('')
function retry() {
  result.value = null
  answers.value = props.lesson.questions.map(() => -1)
}
const api = useApi()
const { user } = useSession()
async function submit() {
  if (!user.value) {
    await navigateTo('/auth/login')
    return
  }
  const owner = user.value.id
  busy.value = true
  error.value = ''
  try {
    const response = await api<QuizResult>(
      `/learning/${props.lesson.id}/quiz`,
      { method: 'POST', body: { answers: answers.value } },
    )
    if (user.value?.id !== owner) return
    result.value = response
    await refreshNuxtData(`private:progress:${owner}`)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="quiz-intro">
    <h2>Проверь понимание</h2>
    <p>
      {{ lesson.questions.length }} вопросов по теме: понимание понятий и
      применение правил. Для зачёта нужно не менее
      {{ Math.ceil(lesson.questions.length * 0.7) }} верных ответов. За успешный
      тест — 30 XP, один раз.
    </p>
  </div>
  <form @submit.prevent="submit">
    <fieldset
      v-for="(question, index) in lesson.questions"
      :key="question.id"
      class="quiz-question"
      :disabled="busy || !!result"
    >
      <legend>
        <span class="eyebrow"
          >Вопрос {{ index + 1 }} / {{ lesson.questions.length }}</span
        >{{ question.prompt }}
      </legend>
      <label
        v-for="(option, choice) in question.options"
        :key="choice"
        :class="{ selected: answers[index] === choice }"
        ><input
          v-model="answers[index]"
          type="radio"
          :name="question.id"
          :value="choice"
          required /><span>{{ option }}</span
        ><AppIcon
          v-if="result?.review[index]?.answer === choice"
          name="check"
          :size="18"
      /></label>
      <p
        v-if="result?.review[index]"
        class="quiz-review"
        :class="{ 'error-text': !result.review[index]?.correct }"
      >
        {{ result.review[index]?.correct ? 'Верно.' : 'Стоит повторить.' }}
        {{ result.review[index]?.explanation }}
      </p>
    </fieldset>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <div v-if="result" class="quiz-result" aria-live="polite">
      <AppIcon :name="result.passed ? 'trophy' : 'book'" :size="28" />
      <div>
        <h3>{{ result.passed ? 'Тема усвоена!' : 'Ещё немного практики' }}</h3>
        <p>
          {{ result.score }}% верных ответов
          <span v-if="result.xp">· +{{ result.xp }} XP</span>
        </p>
      </div>
      <button type="button" class="button button-outline" @click="retry">
        Повторить тест
      </button>
    </div>
    <button
      v-else
      class="button"
      type="submit"
      :disabled="busy || answers.some((a) => a < 0)"
    >
      {{ busy ? 'Проверяем…' : 'Проверить ответы'
      }}<AppIcon name="right" :size="18" />
    </button>
  </form>
</template>
