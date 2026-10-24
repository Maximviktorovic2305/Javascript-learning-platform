<script setup lang="ts">
const { user, logout } = useSession()
const { theme, toggle } = useTheme()
const menu = ref(false)
const route = useRoute()
watch(
  () => route.fullPath,
  () => (menu.value = false),
)
const signoutError = ref('')
async function signout() {
  try {
    await logout()
  } catch (error) {
    signoutError.value = errorMessage(error)
  }
}
</script>
<template>
  <header class="site-header" :class="{ 'is-landing': route.path === '/' }">
    <div class="header-inner">
      <BrandLogo />
      <nav class="desktop-nav" aria-label="Главная навигация">
        <NuxtLink to="/courses">Курсы</NuxtLink
        ><NuxtLink to="/practice">Практика</NuxtLink
        ><NuxtLink to="/projects">Проекты</NuxtLink>
      </nav>
      <div class="header-actions">
        <BackgroundMusic />
        <button
          class="icon-button theme-button"
          :aria-label="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
          @click="toggle"
        >
          <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="19" />
        </button>
        <ClientOnly>
          <template v-if="user"
            ><NuxtLink
              to="/dashboard"
              class="button button-small button-outline"
              ><AppIcon name="dashboard" :size="16" />Мой кабинет</NuxtLink
            ></template
          >
          <template v-else
            ><NuxtLink to="/auth/login" class="login-link">Войти</NuxtLink
            ><NuxtLink to="/auth/register" class="button button-small"
              >Начать учиться <AppIcon name="arrow" :size="16" /></NuxtLink
          ></template>
          <template #fallback
            ><NuxtLink to="/courses" class="button button-small"
              >Начать учиться <AppIcon name="arrow" :size="16" /></NuxtLink
          ></template>
        </ClientOnly>
        <button
          class="icon-button mobile-menu-toggle"
          :aria-expanded="menu"
          aria-controls="mobile-nav"
          aria-label="Открыть меню"
          @click="menu = !menu"
        >
          <AppIcon :name="menu ? 'close' : 'menu'" />
        </button>
      </div>
    </div>
    <nav
      v-if="menu"
      id="mobile-nav"
      class="mobile-nav"
      aria-label="Мобильная навигация"
    >
      <NuxtLink to="/courses">Курсы</NuxtLink
      ><NuxtLink to="/practice">Практика</NuxtLink
      ><NuxtLink to="/projects">Проекты</NuxtLink
      ><NuxtLink to="/dashboard">Мой кабинет</NuxtLink
      ><button @click="toggle">
        {{ theme === 'dark' ? 'Светлая тема' : 'Тёмная тема' }}</button
      ><button v-if="user" @click="signout">Выйти</button>
      <p v-if="signoutError" role="alert">{{ signoutError }}</p>
    </nav>
  </header>
</template>
