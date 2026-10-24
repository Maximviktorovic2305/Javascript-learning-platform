<script setup lang="ts">
const { user, logout } = useSession()
const message = ref('')
async function signout() {
  try {
    await logout()
  } catch (error) {
    message.value = errorMessage(error)
  }
}
</script>
<template>
  <div class="site-shell">
    <a href="#main" class="skip-link">К содержимому</a><SiteHeader />
    <div class="workspace container">
      <aside class="workspace-sidebar">
        <p class="eyebrow">Твоё пространство</p>
        <nav aria-label="Кабинет">
          <NuxtLink to="/dashboard"><AppIcon name="dashboard" />Обзор</NuxtLink
          ><NuxtLink to="/courses"><AppIcon name="book" />Мои курсы</NuxtLink
          ><NuxtLink to="/practice"><AppIcon name="code" />Задачи</NuxtLink
          ><NuxtLink to="/projects"><AppIcon name="branch" />Проекты</NuxtLink
          ><NuxtLink to="/profile"><AppIcon name="user" />Профиль</NuxtLink>
        </nav>
        <div class="sidebar-bottom">
          <span class="avatar">{{ user?.name.slice(0, 1) ?? 'S' }}</span>
          <div>
            <strong>{{ user?.name ?? 'Ученик' }}</strong
            ><small>Каждый день — на шаг вперёд</small>
          </div>
          <button class="icon-button" aria-label="Выйти" @click="signout">
            <AppIcon name="logout" :size="18" />
          </button>
        </div>
        <p v-if="message" role="alert" class="error-text">{{ message }}</p>
      </aside>
      <main id="main" class="workspace-main"><slot /></main>
    </div>
  </div>
</template>
