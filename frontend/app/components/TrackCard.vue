<script setup lang="ts">
import type { Track } from '#shared/types/api'
defineProps<{ track: Track; index?: number }>()
</script>
<template>
  <NuxtLink
    :to="`/courses/${track.id}`"
    class="track-card"
    :class="`track-${track.color}`"
    ><div class="track-card-top">
      <span class="track-mark">{{ track.mark }}</span
      ><span class="track-number">0{{ (index ?? 0) + 1 }}</span>
    </div>
    <span class="eyebrow">{{ track.label }}</span>
    <h3>{{ track.name }}<AppIcon name="arrow" :size="23" /></h3>
    <p>{{ track.description }}</p>
    <div class="track-card-bottom">
      <span
        >{{ track.lessonCount }} тем <span class="dot-divider">·</span>
        {{ track.level }}</span
      ><AppIcon name="right" :size="18" /></div
  ></NuxtLink>
</template>
