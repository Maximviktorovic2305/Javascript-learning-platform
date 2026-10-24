<script setup lang="ts">
import { LEGAL_VERSION } from "~/utils/legal";
const route = useRoute();
const mode = computed(() =>
  route.params.mode === "register" ? "register" : "login",
);
if (!["register", "login"].includes(String(route.params.mode)))
  throw createError({ statusCode: 404, statusMessage: "Страница не найдена" });
usePageSeo({
  title: () => (mode.value === "register" ? "Создать аккаунт" : "Войти"),
});
const { signIn } = useSession();
const name = ref(""),
  email = ref(""),
  password = ref("");
const busy = ref(false),
  error = ref("");
const termsAccepted = ref(false),
  dataConsent = ref(false);
watch(mode, () => {
  error.value = "";
  password.value = "";
  termsAccepted.value = false;
  dataConsent.value = false;
});
async function submit() {
  busy.value = true;
  error.value = "";
  try {
    await signIn(mode.value, {
      email: email.value,
      password: password.value,
      ...(mode.value === "register"
        ? {
            name: name.value,
            termsAccepted: termsAccepted.value,
            dataConsent: dataConsent.value,
            legalVersion: LEGAL_VERSION,
          }
        : {}),
    });
    await navigateTo("/dashboard");
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
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
        {{ mode === "register" ? "Новый старт" : "С возвращением" }}</span
      >
      <h2>
        {{ mode === "register" ? "Создай свой аккаунт" : "Продолжим учиться?" }}
      </h2>
      <p>
        {{
          mode === "register"
            ? "Начни свой путь в разработку. Бесплатно."
            : "Войди, чтобы открыть свой прогресс."
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
        <div v-if="mode === 'register'" class="consent-fields">
          <label
            ><input
              v-model="termsAccepted"
              type="checkbox"
              name="termsAccepted"
              required
            />
            <span
              >Принимаю
              <NuxtLink
                to="/user-agreement"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link"
                >условия использования</NuxtLink
              >.</span
            >
          </label>
          <label
            ><input
              v-model="dataConsent"
              type="checkbox"
              name="dataConsent"
              required
            />
            <span
              >Даю
              <NuxtLink
                to="/data-consent"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link"
                >согласие на обработку персональных данных</NuxtLink
              >.
              <NuxtLink
                to="/private-policy"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link"
                >Политика конфиденциальности</NuxtLink
              >.</span
            >
          </label>
        </div>
        <p v-if="error" class="error-text" role="alert">{{ error }}</p>
        <button class="button" type="submit" :disabled="busy">
          {{
            busy
              ? "Подождите…"
              : mode === "register"
                ? "Создать аккаунт"
                : "Войти"
          }}<AppIcon
            :name="busy ? 'loading' : 'arrow'"
            :class="{ spin: busy }"
            :size="18"
          />
        </button>
      </form>
      <p class="auth-switch">
        {{ mode === "register" ? "Уже есть аккаунт?" : "Пока нет аккаунта?" }}
        <NuxtLink
          :to="mode === 'register' ? '/auth/login' : '/auth/register'"
          >{{ mode === "register" ? "Войти" : "Зарегистрироваться" }}</NuxtLink
        >
      </p>
      <p class="auth-privacy">
        <AppIcon name="lock" :size="14" />Пароль хранится только в защищённом
        виде
      </p>
    </div>
  </div>
</template>
<style scoped>
.consent-fields {
  display: grid;
  gap: 0.75rem;
}
.consent-fields label {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.75rem;
  line-height: 1.65;
  font-weight: 400;
}
.consent-fields input {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
  margin: 0.2rem 0 0;
  padding: 0;
}
</style>
