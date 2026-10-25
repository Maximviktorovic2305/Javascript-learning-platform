import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
  type InjectionKey,
} from 'vue'

export const backgroundMusicKey: InjectionKey<
  ReturnType<typeof useBackgroundMusic>
> = Symbol('backgroundMusic')

export const MUSIC_PREFERENCE_KEY = 'jslab:background-music'

type MusicAudio = Pick<
  HTMLAudioElement,
  'play' | 'pause' | 'paused' | 'error' | 'load'
>

export function createMusicPlayback(options: {
  audio: () => MusicAudio | null
  read: () => string | null
  write: (value: string) => void
}) {
  const enabled = ref(false)
  const playing = ref(false)
  const pending = ref(false)
  const blocked = ref(false)
  const error = ref('')
  let revision = 0
  let disposed = false

  function save() {
    try {
      options.write(enabled.value ? 'on' : 'off')
    } catch {
      // Playback also works when storage is unavailable.
    }
  }

  async function start() {
    const audio = options.audio()
    if (!audio || disposed || !enabled.value || pending.value) return
    const request = ++revision
    pending.value = true
    blocked.value = false
    error.value = ''
    try {
      if (audio.error) audio.load()
      await audio.play()
      if (disposed || !enabled.value) {
        audio.pause()
        return
      }
      if (request !== revision) return
      playing.value = !audio.paused
    } catch (failure) {
      if (disposed || request !== revision) return
      playing.value = false
      if (failure instanceof Error && failure.name === 'NotAllowedError') {
        blocked.value = true
      } else {
        error.value =
          'Музыка не загрузилась. Нажмите, чтобы попробовать ещё раз.'
      }
    } finally {
      if (request === revision) pending.value = false
    }
  }

  async function setEnabled(value: boolean, persist = true) {
    enabled.value = value
    if (persist) save()
    if (value) {
      await start()
    } else {
      revision++
      pending.value = false
      blocked.value = false
      playing.value = false
      error.value = ''
      options.audio()?.pause()
    }
  }

  async function restore() {
    let saved: string | null = null
    try {
      saved = options.read()
    } catch {
      // Restricted storage still uses the default music preference.
    }
    await setEnabled(saved !== 'off', false)
  }

  function toggle() {
    return setEnabled(!(playing.value || pending.value))
  }

  function retryAfterGesture() {
    if (enabled.value && blocked.value) return start()
  }

  function paused() {
    playing.value = false
  }

  function failed() {
    revision++
    pending.value = false
    playing.value = false
    blocked.value = false
    error.value = 'Музыка не загрузилась. Нажмите, чтобы попробовать ещё раз.'
  }

  function dispose() {
    disposed = true
    revision++
    pending.value = false
    playing.value = false
    options.audio()?.pause()
  }

  return {
    enabled,
    playing,
    pending,
    blocked,
    error,
    restore,
    toggle,
    setEnabled,
    retryAfterGesture,
    paused,
    failed,
    dispose,
  }
}

export function useBackgroundMusic(
  audio: Readonly<Ref<HTMLAudioElement | null>>,
) {
  const player = createMusicPlayback({
    audio: () => audio.value,
    read: () => localStorage.getItem(MUSIC_PREFERENCE_KEY),
    write: (value) => localStorage.setItem(MUSIC_PREFERENCE_KEY, value),
  })
  const ready = ref(false)
  const label = computed(() =>
    player.pending.value
      ? 'Остановить загрузку музыки'
      : player.playing.value
        ? 'Выключить фоновую музыку'
        : 'Включить фоновую музыку',
  )

  function gesture(event: Event) {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-music-control]')
    )
      return
    player.retryAfterGesture()
  }

  function storageChanged(event: StorageEvent) {
    if (event.key === MUSIC_PREFERENCE_KEY || event.key === null) {
      void player.setEnabled(event.newValue !== 'off', false)
    }
  }

  onMounted(() => {
    if (audio.value) audio.value.volume = 0.24
    ready.value = true
    document.addEventListener('click', gesture)
    document.addEventListener('keydown', gesture)
    window.addEventListener('storage', storageChanged)
    void player.restore()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', gesture)
    document.removeEventListener('keydown', gesture)
    window.removeEventListener('storage', storageChanged)
    player.dispose()
  })

  return { ...player, ready, label }
}
