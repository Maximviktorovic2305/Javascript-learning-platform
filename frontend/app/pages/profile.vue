<script setup lang="ts">
import type { User, Track } from '#shared/types/api'
import {
  nameError,
  timezoneError,
  passwordError as validatePassword,
  dailyGoalError,
} from '~/utils/formValidation'
import { systemTimezone, timezoneOptions } from '~/utils/timezones'
definePageMeta({ layout: 'workspace', middleware: 'auth' })
usePageSeo({ title: 'Профиль', robots: 'noindex' })
const { user, clear } = useSession()
const api = useApi()
const {
  data: progress,
  status: progressStatus,
  error: progressError,
  refresh: refreshProgress,
} = useProgress()
const {
  data: tracks,
  status: tracksStatus,
  error: tracksError,
  refresh: refreshTracks,
} = await useFetch<Track[]>('/api/catalog/tracks')
const joined = computed(() =>
  user.value
    ? new Intl.DateTimeFormat('ru', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: user.value.timezone,
      }).format(new Date(user.value.createdAt))
    : '',
)
const goalPresets = [30, 50, 100]
const name = ref(user.value?.name ?? '')
const detectedTimezone = ref(user.value?.timezone ?? 'UTC')
onMounted(() => {
  detectedTimezone.value = systemTimezone()
})
const timezoneChoice = ref(
  user.value?.timezoneAuto ? 'system' : (user.value?.timezone ?? 'system'),
)
const timezone = computed(() =>
  timezoneChoice.value === 'system'
    ? detectedTimezone.value
    : timezoneChoice.value,
)
const timezones = computed(() =>
  timezoneOptions(user.value?.timezone ?? 'UTC', detectedTimezone.value),
)
const dailyGoal = ref<number | string>(user.value?.dailyGoal ?? 50)
const currentPassword = ref(''),
  nextPassword = ref('')
const validation = computed(() => ({
  name: nameError(name.value),
  timezone: timezoneError(timezone.value),
  dailyGoal: dailyGoalError(dailyGoal.value),
}))
const passwordValidation = computed(() => ({
  current: validatePassword(currentPassword.value),
  next: validatePassword(nextPassword.value),
}))
const touched = reactive({ current: false, next: false })
const busy = ref(false),
  passwordBusy = ref(false),
  message = ref(''),
  error = ref(''),
  passwordError = ref('')
async function save() {
  if (busy.value || Object.values(validation.value).some(Boolean)) return
  const owner = user.value?.id
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    const updated = await api<User>('/profile', {
      method: 'PATCH',
      body: {
        name: name.value,
        timezone: timezone.value,
        timezoneAuto: timezoneChoice.value === 'system',
        dailyGoal: Number(dailyGoal.value),
      },
    })
    if (user.value?.id !== owner) return
    user.value = updated
    await refreshNuxtData(`private:progress:${owner}`)
    message.value = 'Изменения сохранены.'
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
async function password() {
  if (
    passwordBusy.value ||
    Object.values(passwordValidation.value).some(Boolean)
  )
    return
  passwordBusy.value = true
  passwordError.value = ''
  try {
    await api('/profile/password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        nextPassword: nextPassword.value,
      },
    })
    clear()
    await navigateTo('/auth/login')
  } catch (e) {
    passwordError.value = errorMessage(e)
  } finally {
    passwordBusy.value = false
  }
}
</script>
<template>
  <p class="eyebrow">Твой путь в разработке</p>
  <h1>Твой профиль<span class="accent-text">.</span></h1>
  <div class="profile-intro">
    <span class="avatar large">{{ user?.name.slice(0, 1) }}</span>
    <div>
      <h3>{{ user?.name }}</h3>
      <p>{{ user?.email }}</p>
      <small>В JSlab с {{ joined }}</small>
    </div>
  </div>
  <AsyncState
    :pending="progressStatus === 'pending' || tracksStatus === 'pending'"
    :error="progressError || tracksError"
    @retry="
      () => {
        refreshProgress()
        refreshTracks()
      }
    "
  >
    <ProfileProgress
      v-if="progress && tracks && user"
      :progress="progress"
      :tracks="tracks"
      :timezone="user.timezone"
    />
  </AsyncState>
  <form class="settings-card" novalidate @submit.prevent="save">
    <div class="profile-section-heading">
      <h2>Учись в своём ритме</h2>
      <AppIcon name="user" />
    </div>
    <div class="form-grid">
      <label
        >Имя<input
          v-model="name"
          :aria-invalid="!!validation.name"
          aria-describedby="profile-name-error"
          autocomplete="name"
          minlength="2"
          maxlength="60"
          required
        /><span
          v-if="validation.name"
          id="profile-name-error"
          class="error-text"
          >{{ validation.name }}</span
        ></label
      ><label
        >Часовой пояс<select
          v-model="timezoneChoice"
          aria-label="Часовой пояс"
          :aria-invalid="!!validation.timezone"
          aria-describedby="timezone-error"
          required
        >
          <option value="system">Автоматически — {{ detectedTimezone }}</option>
          <option
            v-for="zone in timezones"
            :key="zone.value"
            :value="zone.value"
          >
            {{ zone.label }}
          </option></select
        ><span
          v-if="validation.timezone"
          id="timezone-error"
          class="error-text"
          >{{ validation.timezone }}</span
        ><small
          >Автоматический режим использует часовой пояс устройства. Можно
          выбрать другой.</small
        ></label
      >
      <div class="profile-goal-field">
        <label
          >Дневная цель, XP<input
            v-model.number="dailyGoal"
            type="number"
            min="1"
            max="2147483647"
            step="1"
            inputmode="numeric"
            required
            aria-label="Дневная цель, XP"
            :aria-invalid="!!validation.dailyGoal"
            aria-describedby="daily-goal-error"
        /></label>
        <span
          v-if="validation.dailyGoal"
          id="daily-goal-error"
          class="error-text"
          >{{ validation.dailyGoal }}</span
        >
        <div class="goal-presets" aria-label="Быстрый выбор дневной цели">
          <button
            v-for="goal in goalPresets"
            :key="goal"
            type="button"
            class="button button-small button-outline"
            :aria-pressed="dailyGoal === goal"
            @click="dailyGoal = goal"
          >
            {{ goal }} XP
          </button>
        </div>
        <small
          >Введите любое положительное целое число XP или выберите готовый
          вариант.</small
        >
      </div>
    </div>
    <p v-if="message" class="success-text" role="status">{{ message }}</p>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <button
      class="button"
      :disabled="busy || Object.values(validation).some(Boolean)"
    >
      {{ busy ? 'Сохраняем…' : 'Сохранить изменения' }}
    </button>
  </form>
  <section v-if="progress" class="settings-card">
    <h2>Твои достижения</h2>
    <div class="achievements-grid">
      <article
        v-for="achievement in progress?.achievements"
        :key="achievement.id"
        :class="{ unlocked: achievement.unlocked }"
      >
        <AppIcon :name="achievement.unlocked ? 'trophy' : 'lock'" :size="24" />
        <h3>{{ achievement.title }}</h3>
        <p>{{ achievement.description }}</p>
        <small>{{ achievement.unlocked ? 'Получено' : 'Впереди' }}</small>
      </article>
    </div>
  </section>
  <form class="settings-card" novalidate @submit.prevent="password">
    <div class="profile-section-heading">
      <h2>Изменить пароль</h2>
      <AppIcon name="shield" />
    </div>
    <p>После смены пароля все сессии будут завершены. Войди с новым паролем.</p>
    <div class="form-grid">
      <label
        >Текущий пароль<input
          v-model="currentPassword"
          :aria-invalid="touched.current && !!passwordValidation.current"
          aria-describedby="current-password-error"
          @blur="touched.current = true"
          type="password"
          autocomplete="current-password"
          minlength="10"
          maxlength="128"
          required
        /><span
          v-if="touched.current && passwordValidation.current"
          id="current-password-error"
          class="error-text"
          >{{ passwordValidation.current }}</span
        ></label
      ><label
        >Новый пароль<input
          v-model="nextPassword"
          :aria-invalid="touched.next && !!passwordValidation.next"
          aria-describedby="next-password-error"
          @blur="touched.next = true"
          type="password"
          autocomplete="new-password"
          minlength="10"
          maxlength="128"
          required
        /><span
          v-if="touched.next && passwordValidation.next"
          id="next-password-error"
          class="error-text"
          >{{ passwordValidation.next }}</span
        ></label
      >
    </div>
    <p v-if="passwordError" class="error-text" role="alert">
      {{ passwordError }}
    </p>
    <button
      class="button button-outline"
      :disabled="
        passwordBusy || Object.values(passwordValidation).some(Boolean)
      "
    >
      {{ passwordBusy ? 'Сохраняем…' : 'Изменить пароль' }}
    </button>
  </form>
</template>
