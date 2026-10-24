<script setup lang="ts">
const config = useRuntimeConfig()
const presets = {
  original: { video: '/hero-video.mp4', poster: '/hero-crowd.webp' },
  wave: {
    video: '/hero-variants/wave.mp4',
    poster: '/hero-variants/wave.webp',
  },
  team: {
    video: '/hero-variants/team.mp4',
    poster: '/hero-variants/team.webp',
  },
  pixels: {
    video: '/hero-variants/pixels.mp4',
    poster: '/hero-variants/pixels.webp',
  },
  'blue-javascript': {
    video: '/hero-variants/blue-javascript.mp4',
    poster: '/hero-variants/blue-javascript.webp',
  },
  'blue-preserved-javascript': {
    video: '/hero-variants/blue-preserved-javascript.mp4',
    poster: '/hero-variants/blue-preserved-javascript.webp',
  },
  'blue-smooth-javascript': {
    video: '/hero-variants/blue-smooth-javascript.mp4',
    poster: '/hero-variants/blue-smooth-javascript.webp',
  },
  'blue-full-hands-javascript': {
    video: '/hero-variants/blue-full-hands-javascript.mp4',
    poster: '/hero-variants/blue-full-hands-javascript.webp',
  },
  'cardboard-javascript': {
    video: '/hero-variants/cardboard-javascript.mp4',
    poster: '/hero-variants/cardboard-javascript.webp',
  },
  'blue-grounded-javascript': {
    video: '/hero-variants/blue-grounded-javascript.mp4',
    poster: '/hero-variants/blue-grounded-javascript.webp',
  },
  'blue-large-javascript': {
    video: '/hero-variants/blue-large-javascript.mp4',
    poster: '/hero-variants/blue-large-javascript.webp',
  },
  'blue-refined-javascript': {
    video: '/hero-variants/blue-refined-javascript.mp4',
    poster: '/hero-variants/blue-refined-javascript.webp',
  },
  'blue-clean-javascript': {
    video: '/hero-variants/blue-clean-javascript.mp4',
    poster: '/hero-variants/blue-clean-javascript.webp',
  },
} as const
const variant = Object.hasOwn(presets, config.public.heroVariant)
  ? (config.public.heroVariant as keyof typeof presets)
  : 'original'
const media = presets[variant]
const video = useTemplateRef<HTMLVideoElement>('video')
const root = useTemplateRef<HTMLElement>('scene')
const paused = ref(false)
const reduced = ref(true)
const visible = ref(true)
const started = ref(false)
let observer: IntersectionObserver | undefined
let motion: MediaQueryList | undefined
const source = ref<string>()
function syncPlayback() {
  if (!video.value) return
  if (paused.value || reduced.value || !visible.value || document.hidden)
    video.value.pause()
  else {
    source.value = media.video
    nextTick(() =>
      video.value
        ?.play()
        .then(() => (started.value = true))
        .catch(() => {}),
    )
  }
}
function motionChanged() {
  reduced.value = motion?.matches ?? true
  syncPlayback()
}
function pointer(event: PointerEvent) {
  if (
    paused.value ||
    reduced.value ||
    event.pointerType !== 'mouse' ||
    !root.value
  )
    return
  const box = root.value.getBoundingClientRect()
  root.value.style.setProperty(
    '--pointer-x',
    `${(event.clientX - box.left - box.width / 2) * 0.015}px`,
  )
  root.value.style.setProperty(
    '--pointer-y',
    `${(event.clientY - box.top - box.height / 2) * 0.015}px`,
  )
}
function resetPointer() {
  root.value?.style.setProperty('--pointer-x', '0px')
  root.value?.style.setProperty('--pointer-y', '0px')
}
function toggle() {
  paused.value = !paused.value
  syncPlayback()
}
onMounted(() => {
  motion = matchMedia('(prefers-reduced-motion: reduce)')
  motionChanged()
  motion.addEventListener('change', motionChanged)
  observer = new IntersectionObserver(
    ([entry]) => {
      visible.value = entry?.isIntersecting ?? false
      syncPlayback()
    },
    { threshold: 0.05 },
  )
  if (root.value) observer.observe(root.value)
  document.addEventListener('visibilitychange', syncPlayback)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  motion?.removeEventListener('change', motionChanged)
  document.removeEventListener('visibilitychange', syncPlayback)
})
</script>
<template>
  <section
    ref="scene"
    class="hero-scene"
    :data-hero-variant="variant"
    :class="{ 'is-paused': paused || reduced }"
    @pointermove="pointer"
    @pointerleave="resetPointer"
  >
    <div class="hero-visual" aria-hidden="true">
      <img
        :src="media.poster"
        width="1280"
        height="720"
        alt=""
        fetchpriority="high"
      /><video
        ref="video"
        :src="source"
        :class="{ ready: started }"
        muted
        loop
        playsinline
        preload="none"
        :poster="media.poster"
      />
      <div class="hero-light" />
    </div>
    <div class="hero-shade" />
    <div class="hero-content container">
      <h1>Кто хочет научиться <span>JavaScript?</span></h1>
      <p class="hero-course-note">
        Курс по JS — абсолютно бесплатно, с практикой и тестами.
      </p>
    </div>
  </section>
  <div class="hero-playback-bar container">
    <button
      class="hero-playback-button"
      :aria-label="paused ? 'Продолжить анимацию' : 'Приостановить анимацию'"
      :aria-pressed="paused"
      @click="toggle"
    >
      <AppIcon :name="paused ? 'play' : 'pause'" :size="14" /><span>{{
        reduced ? 'Движение уменьшено' : paused ? 'Продолжить' : 'Пауза'
      }}</span>
    </button>
  </div>
</template>
