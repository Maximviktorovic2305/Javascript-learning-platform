<script setup lang="ts">
import type { Project, ProjectSubmission } from '#shared/types/api'
const props = defineProps<{
  project: Project
  submission?: ProjectSubmission
}>()
const emit = defineEmits<{ submitted: [] }>()
const { user } = useSession()
const api = useApi()
const url = ref(props.submission?.url ?? '')
watch(
  () => props.submission?.url,
  (value, previous) => {
    // A background refresh must not replace a link the user has started editing.
    if (value && (url.value === (previous ?? '') || !url.value))
      url.value = value
  },
)
const expanded = ref(false),
  busy = ref(false),
  message = ref(''),
  error = ref('')
async function submit() {
  if (!user.value) {
    await navigateTo('/auth/login')
    return
  }
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await api(`/projects/${props.project.id}/submit`, {
      method: 'POST',
      body: { url: url.value },
    })
    message.value = 'Ссылка сохранена. Работу можно обновить в любой момент.'
    emit('submitted')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <article class="project-card">
    <div class="project-top">
      <span class="project-category">{{
        project.trackId === 'nest' ? 'NestJS' : project.trackId
      }}</span
      ><span v-if="submission" class="project-status"
        ><AppIcon name="check" :size="14" />Ссылка сохранена</span
      ><AppIcon v-else name="branch" :size="23" />
    </div>
    <h2>{{ project.title }}</h2>
    <p>{{ project.description }}</p>
    <span class="project-stack">{{ project.stack }}</span>
    <h3>Что должно получиться</h3>
    <ul class="criteria-list">
      <li v-for="criterion in project.criteria" :key="criterion">
        <AppIcon name="check" :size="15" />{{ criterion }}
      </li>
    </ul>
    <button
      class="button button-outline"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Свернуть' : 'Добавить свою работу'
      }}<AppIcon name="arrow" :size="17" />
    </button>
    <form
      v-if="expanded"
      class="project-form ym-hide-content"
      @submit.prevent="submit"
    >
      <label
        >Ссылка на репозиторий или демо<input
          v-model="url"
          type="url"
          required
          maxlength="2000"
          pattern="https://.*"
          placeholder="https://github.com/you/project"
      /></label>
      <p v-if="error" class="error-text" role="alert">{{ error }}</p>
      <p v-if="message" class="success-text" role="status">{{ message }}</p>
      <button class="button button-small" :disabled="busy">
        {{
          busy
            ? 'Сохраняем…'
            : submission
              ? 'Обновить ссылку'
              : 'Сохранить работу'
        }}</button
      ><small
        >Проект — самостоятельная практика. За отправку ссылки XP не
        начисляются.</small
      >
    </form>
  </article>
</template>
