<script setup lang="ts">
import { createMetrikaClient } from "~/utils/metrika";
const config = useRuntimeConfig();
const route = useRoute();
const id = Number(config.public.metrikaId);
const choice = ref<"accepted" | "rejected" | null>(null);
const ready = ref(false);
const opened = ref(false);
const storageKey = "jslab:analytics-consent";
let counter: ReturnType<typeof createMetrikaClient> | undefined;
function sync() {
  if (choice.value === "accepted") {
    counter?.start(id);
    counter?.page(route.path);
  } else counter?.stop();
}
function choose(value: "accepted" | "rejected") {
  choice.value = value;
  opened.value = false;
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    /* Keep this tab's choice. */
  }
  sync();
}
function restore() {
  try {
    const stored = localStorage.getItem(storageKey);
    choice.value =
      stored === "accepted" || stored === "rejected" ? stored : null;
  } catch {
    choice.value = null;
  }
  sync();
}
onMounted(() => {
  counter = createMetrikaClient(window, document);
  restore();
  ready.value = true;
  window.addEventListener("storage", restore);
});
watch(
  () => route.path,
  () => {
    nextTick(sync);
  },
);
onBeforeUnmount(() => {
  window.removeEventListener("storage", restore);
  counter?.stop();
});
</script>
<template>
  <template v-if="ready">
    <button class="analytics-settings text-link" @click="opened = true">
      Настройки cookie
    </button>
    <section
      v-if="choice === null || opened"
      class="analytics-consent"
      aria-label="Информация о cookie"
    >
      <div>
        <strong>Используем cookie</strong>
        <p>
          Сохраняем вход, настройки и черновики.
          <template v-if="Number.isSafeInteger(id) && id > 0">
            Яндекс Метрика — только с вашего разрешения.
          </template>
          <NuxtLink to="/cookie-policy" class="text-link">Подробнее</NuxtLink>.
        </p>
      </div>
      <div class="analytics-actions">
        <button
          class="button button-outline button-small"
          @click="choose('rejected')"
        >
          {{ id > 0 ? "Только необходимые" : "Понятно" }}</button
        ><button
          v-if="Number.isSafeInteger(id) && id > 0"
          class="button button-small"
          @click="choose('accepted')"
        >
          Разрешить аналитику
        </button>
      </div>
    </section>
  </template>
</template>
<style scoped>
.analytics-settings {
  display: block;
  margin: 0 auto 1.5rem;
  font-size: 0.75rem;
}
.analytics-consent {
  position: fixed;
  z-index: 100;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  width: min(23rem, calc(100vw - 2rem));
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  padding: 0.875rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 0.5rem 2rem #0002;
  font-size: 0.8125rem;
}
.analytics-consent p {
  margin: 0.375rem 0 0;
  color: var(--muted);
  font-size: 0.6875rem;
  line-height: 1.55;
}
.analytics-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-shrink: 0;
  justify-content: flex-end;
}
</style>
