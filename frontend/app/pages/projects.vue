<script setup lang="ts">
import type { Project, ProjectSubmission } from '#shared/types/api'
usePageSeo({
  title: 'Проекты',
  description:
    'Закрепите JavaScript, TypeScript, Express и NestJS в самостоятельных проектах.',
})
const { data, status, error, refresh } = await useFetch<Project[]>(
  '/api/catalog/projects',
)
if (import.meta.server && error.value)
  throw createError({
    statusCode: 503,
    statusMessage: 'Проекты временно недоступны',
  })
const { user } = useSession()
const api = useApi()
const { data: submissions, refresh: refreshSubmissions } = useAsyncData(
  computed(() => `private:submissions:${user.value?.id ?? 'guest'}`),
  (_app, { signal }) =>
    user.value
      ? api<ProjectSubmission[]>('/projects/submissions', { signal })
      : Promise.resolve([]),
  { server: false },
)
</script>
<template>
  <div class="container page-content">
    <p class="eyebrow"><span class="accent-line" />От знаний к результату</p>
    <div class="page-heading">
      <h1>
        Сделай что-то<br /><span class="accent-text">по-настоящему своё.</span>
      </h1>
      <p>
        Четыре проекта для закрепления навыков.<br />Сохрани ссылку на
        репозиторий или рабочее демо.
      </p>
    </div>
    <AsyncState :pending="status === 'pending'" :error="error" @retry="refresh"
      ><div class="projects-grid">
        <ProjectCard
          v-for="project in data"
          :key="project.id"
          :project="project"
          :submission="submissions?.find((s) => s.projectId === project.id)"
          @submitted="refreshSubmissions"
        /></div
    ></AsyncState>
  </div>
</template>
