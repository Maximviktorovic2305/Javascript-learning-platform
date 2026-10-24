<script setup lang="ts">
defineProps<{ pending?: boolean; error?: unknown }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div v-if="pending" class="state-panel" role="status">
    <AppIcon name="loading" class="spin" />Загружаем…
  </div>
  <div v-else-if="error" class="state-panel" role="alert">
    <AppIcon name="help" />
    <p>{{ errorMessage(error) }}</p>
    <button class="button button-outline" @click="$emit('retry')">
      Попробовать снова
    </button>
  </div>
  <slot v-else />
</template>
