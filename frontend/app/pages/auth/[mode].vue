<script setup lang="ts">
import { LEGAL_VERSION } from "~/utils/legal";
import { nameError, emailError, passwordError } from "~/utils/formValidation";
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
const touched = reactive({ name: false, email: false, password: false });
const validation = computed(() => ({
  name: mode.value === "register" ? nameError(name.value) : "",
  email: emailError(email.value),
  password: passwordError(password.value),
}));
const canSubmit = computed(
  () =>
    !busy.value &&
    !Object.values(validation.value).some(Boolean) &&
    (mode.value === "login" || (termsAccepted.value && dataConsent.value)),
);
watch([name, email, password, termsAccepted, dataConsent], () => {
  error.value = "";
});
watch(mode, () => {
  error.value = "";
  password.value = "";
  termsAccepted.value = false;
  dataConsent.value = false;
  Object.assign(touched, { name: false, email: false, password: false });
});
async function submit() {
  if (!canSubmit.value) return;
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
      <form novalidate @submit.prevent="submit">
        <label v-if="mode === 'register'"
          >Как тебя зовут<input
            v-model="name"
            :aria-invalid="touched.name && !!validation.name"
            aria-describedby="name-error"
            @blur="touched.name = true"
            type="text"
            name="name"
            autocomplete="name"
            minlength="2"
            maxlength="60"
            required
            placeholder="Твоё имя"
          /><span
            v-if="touched.name && validation.name"
            id="name-error"
            class="error-text"
            >{{ validation.name }}</span
          ></label
        ><label
          >Электронная почта<input
            v-model="email"
            :aria-invalid="touched.email && !!validation.email"
            aria-describedby="email-error"
            @blur="touched.email = true"
            type="email"
            name="email"
            autocomplete="email"
            maxlength="254"
            required
            placeholder="you@example.com"
          /><span
            v-if="touched.email && validation.email"
            id="email-error"
            class="error-text"
            >{{ validation.email }}</span
          ></label
        ><label
          >Пароль<input
            v-model="password"
            :aria-invalid="touched.password && !!validation.password"
            aria-describedby="password-error"
            @blur="touched.password = true"
            type="password"
            name="password"
            :autocomplete="
              mode === 'register' ? 'new-password' : 'current-password'
            "
            minlength="10"
            maxlength="128"
            required
            placeholder="Не менее 10 символов"
          /><span
            v-if="touched.password && validation.password"
            id="password-error"
            class="error-text"
            >{{ validation.password }}</span
          ></label
        >
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
        <button class="button" type="submit" :disabled="!canSubmit">
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
  align-items: center;
  gap: 0.6rem;
  font-size: 0.75rem;
  line-height: 1.65;
  font-weight: 400;
  cursor: pointer;
}
.consent-fields input {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
  min-height: 0;
  margin: 0;
  padding: 0;
}
.consent-fields .text-link {
  display: inline;
}
.consent-fields label:hover {
  color: var(--interaction);
}
.consent-fields label:has(input:focus-visible) {
  outline: 1px solid var(--interaction);
  outline-offset: 4px;
  border-radius: 3px;
}
</style>
