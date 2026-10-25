<script setup lang="ts">
import { backgroundMusicKey } from '~/composables/useBackgroundMusic'
const music = inject(backgroundMusicKey)
if (!music) throw new Error('Background music provider is missing')
const { playing, pending, error, ready, label, toggle } = music
</script>

<template>
  <div class="background-music" data-music-control>
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
