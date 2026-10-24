<script setup lang="ts">
const route = useRoute()
const mode = computed(() =>
  route.params.mode === 'register' ? 'register' : 'login',
)
if (!['register', 'login'].includes(String(route.params.mode)))
  throw createError({ statusCode: 404, statusMessage: 'Страница не найдена' })
useSeoMeta({
  title: () => (mode.value === 'register' ? 'Создать аккаунт' : 'Войти'),
})
const { signIn } = useSession()
const name = ref(''),
  email = ref(''),
  password = ref('')
const busy = ref(false),
  error = ref('')
watch(mode, () => {
  error.value = ''
  password.value = ''
})
async function submit() {
  busy.value = true
  error.value = ''
  try {
    await signIn(mode.value, {
      email: email.value,
      password: password.value,
      ...(mode.value === 'register' ? { name: name.value } : {}),
    })
    await navigateTo('/dashboard')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="container auth-page">
    <div class="auth-story">
      <p class="eyebrow">
        <span class="accent-line" />Твой код. Твой прогресс.
      </p>
      <h1>
        Каждый эксперт<br />когда-то написал<br /><span class="accent-text"
          >первую строку.</span
        >
      </h1>
      <p>
        Сохраняй решения, собирай опыт и продолжай<br />с того места, где
        остановился.
      </p>
      <div class="auth-code" aria-hidden="true">
        <span class="code-purple">const</span> nextStep =
        <span class="code-green">'начать'</span>;<br /><span
          class="code-comment"
          >// Всё остальное — практика.</span
        >
      </div>
    </div>
    <div class="auth-card">
      <span class="eyebrow"
        >JSlab /
        {{ mode === 'register' ? 'Новый старт' : 'С возвращением' }}</span
      >
      <h2>
        {{ mode === 'register' ? 'Создай свой аккаунт' : 'Продолжим учиться?' }}
      </h2>
      <p>
        {{
          mode === 'register'
            ? 'Начни свой путь в разработку. Бесплатно.'
            : 'Войди, чтобы открыть свой прогресс.'
        }}
      </p>
      <form @submit.prevent="submit">
        <label v-if="mode === 'register'"
          >Как тебя зовут<input
            v-model="name"
            type="text"
            name="name"
            autocomplete="name"
            minlength="2"
            maxlength="60"
            required
            placeholder="Твоё имя" /></label
        ><label
          >Электронная почта<input
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            maxlength="254"
            required
            placeholder="you@example.com" /></label
        ><label
          >Пароль<input
            v-model="password"
            type="password"
            name="password"
            :autocomplete="
              mode === 'register' ? 'new-password' : 'current-password'
            "
            minlength="10"
            maxlength="128"
            required
            placeholder="Не менее 10 символов"
        /></label>
        <p v-if="error" class="error-text" role="alert">{{ error }}</p>
        <button class="button" type="submit" :disabled="busy">
          {{
            busy
              ? 'Подождите…'
              : mode === 'register'
                ? 'Создать аккаунт'
                : 'Войти'
          }}<AppIcon
            :name="busy ? 'loading' : 'arrow'"
            :class="{ spin: busy }"
            :size="18"
          />
        </button>
      </form>
      <p class="auth-switch">
        {{ mode === 'register' ? 'Уже есть аккаунт?' : 'Пока нет аккаунта?' }}
        <NuxtLink
          :to="mode === 'register' ? '/auth/login' : '/auth/register'"
          >{{ mode === 'register' ? 'Войти' : 'Зарегистрироваться' }}</NuxtLink
        >
      </p>
      <p class="auth-privacy">
        <AppIcon name="lock" :size="14" />Пароль хранится только в защищённом
        виде
      </p>
    </div>
  </div>
</template>
