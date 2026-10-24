<script setup lang="ts">
import type { Track } from '#shared/types/api'
defineProps<{ tracks: Track[]; pending?: boolean; error?: unknown }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <section
    id="courses"
    class="course-atlas container"
    aria-labelledby="atlas-title"
  >
    <header class="atlas-heading">
      <div>
        <p class="atlas-index"><span />01 / КАРТА ОБУЧЕНИЯ</p>
        <h2 id="atlas-title">Собери свой <span>стек.</span></h2>
      </div>
      <div class="atlas-heading-note">
        <p>Начни с языка.<br />Дойди до собственного приложения.</p>
        <NuxtLink to="/courses" class="text-link"
          >Вся программа <AppIcon name="arrow" :size="16"
        /></NuxtLink>
      </div>
    </header>
    <AsyncState :pending="pending" :error="error" @retry="$emit('retry')">
      <div class="atlas-stage">
        <NuxtLink
          v-for="(track, index) in tracks"
          :key="track.id"
          :to="`/courses/${track.id}`"
          class="atlas-node"
          :class="[`atlas-${track.id}`, `track-${track.color}`]"
        >
          <div class="atlas-node-top">
            <span class="atlas-coordinate">[0{{ index + 1 }}]</span
            ><span class="atlas-level">{{
              track.id === 'javascript' ? 'Начни здесь' : track.label
            }}</span
            ><AppIcon name="arrow" :size="20" />
          </div>
          <div class="atlas-node-copy">
            <h3>{{ track.name }}</h3>
            <p>{{ track.description }}</p>
          </div>
          <span class="atlas-symbol" aria-hidden="true">{{ track.mark }}</span>
          <div class="atlas-node-bottom">
            <span>{{ track.lessonCount }} тем</span
            ><span>{{ track.level }}</span>
          </div>
        </NuxtLink>
      </div>
      <div class="atlas-caption">
        <span><i />Все направления открыты</span
        ><code>JS → TS → Express → NestJS</code
        ><span>Без подписок. Без оплаты.</span>
      </div>
    </AsyncState>
  </section>
</template>
