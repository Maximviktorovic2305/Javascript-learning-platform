<script setup lang="ts">
import { backgroundMusicKey } from '~/composables/useBackgroundMusic'

const audio = useTemplateRef<HTMLAudioElement>('audio')
const music = useBackgroundMusic(audio)
provide(backgroundMusicKey, music)
</script>

<template>
  <audio
    ref="audio"
    class="background-audio"
    src="/audio/scott-buckley-reverie.mp3"
    loop
    preload="none"
    @pause="music.paused"
    @error="music.failed"
  />
  <slot />
</template>
