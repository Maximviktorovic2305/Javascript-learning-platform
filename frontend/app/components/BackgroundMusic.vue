<script setup lang="ts">
const audio = useTemplateRef<HTMLAudioElement>('audio')
const { playing, pending, error, ready, label, toggle, paused, failed } =
  useBackgroundMusic(audio)
</script>

<template>
  <div class="background-music" data-music-control>
    <audio
      ref="audio"
      src="/audio/scott-buckley-reverie.mp3"
      loop
      preload="none"
      @pause="paused"
      @error="failed"
    />
    <button
      type="button"
      class="icon-button music-toggle"
      :class="{ 'is-playing': playing }"
      :disabled="!ready"
      :aria-label="label"
      :aria-pressed="playing"
      :title="`${label} · Reverie — Scott Buckley`"
      @click="toggle"
    >
      <AppIcon
        :name="pending ? 'loading' : playing ? 'volume' : 'volume-off'"
        :size="17"
      />
    </button>
    <p v-if="error" class="music-error" role="status">{{ error }}</p>
  </div>
</template>
