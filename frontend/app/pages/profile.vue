<script setup lang="ts">
import type { User, Track } from '#shared/types/api'
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
const goalOptions = [
  { value: 30, label: '30 XP — спокойный темп', icon: 'book' as const },
  { value: 50, label: '50 XP — уверенный шаг', icon: 'target' as const },
  { value: 100, label: '100 XP — полный вперёд', icon: 'zap' as const },
]
const name = ref(user.value?.name ?? '')
const timezone = ref(user.value?.timezone ?? 'Asia/Vladivostok')
const dailyGoal = ref(user.value?.dailyGoal ?? 50)
const currentPassword = ref(''),
  nextPassword = ref('')
const busy = ref(false),
  passwordBusy = ref(false),
  message = ref(''),
  error = ref(''),
  passwordError = ref('')
async function save() {
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
        dailyGoal: dailyGoal.value,
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
  <form class="settings-card" @submit.prevent="save">
    <div class="profile-section-heading">
      <h2>Учись в своём ритме</h2>
      <AppIcon name="user" />
    </div>
    <div class="form-grid">
      <label
        >Имя<input
          v-model="name"
          autocomplete="name"
          minlength="2"
          maxlength="60"
          required /></label
      ><label
        >Часовой пояс<input
          v-model="timezone"
          required
          maxlength="80"
          list="timezones" /><datalist id="timezones">
          <option value="Europe/Moscow" />
          <option value="Asia/Vladivostok" />
          <option value="Asia/Yekaterinburg" />
          <option value="Asia/Novosibirsk" />
          <option value="UTC" /></datalist
      ></label>
      <div class="profile-goal-field">
        <span>Дневная цель</span>
        <AppSelect
          :model-value="dailyGoal"
          :options="goalOptions"
          label="Дневная цель"
          @update:model-value="dailyGoal = Number($event)"
        />
      </div>
    </div>
    <p v-if="message" class="success-text" role="status">{{ message }}</p>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <button class="button" :disabled="busy">
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
  <form class="settings-card" @submit.prevent="password">
    <div class="profile-section-heading">
      <h2>Изменить пароль</h2>
      <AppIcon name="shield" />
    </div>
    <p>После смены пароля все сессии будут завершены. Войди с новым паролем.</p>
    <div class="form-grid">
      <label
        >Текущий пароль<input
          v-model="currentPassword"
          type="password"
          autocomplete="current-password"
          minlength="10"
          maxlength="128"
          required /></label
      ><label
        >Новый пароль<input
          v-model="nextPassword"
          type="password"
          autocomplete="new-password"
          minlength="10"
          maxlength="128"
          required
      /></label>
    </div>
    <p v-if="passwordError" class="error-text" role="alert">
      {{ passwordError }}
    </p>
    <button class="button button-outline" :disabled="passwordBusy">
      {{ passwordBusy ? 'Сохраняем…' : 'Изменить пароль' }}
    </button>
  </form>
</template>
