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
        <strong>Мы используем cookie</strong>
        <p>
          Технические cookie помогают сохранять вход и тему. Локальное хранилище
          запоминает настройки и черновики.
          <template v-if="Number.isSafeInteger(id) && id > 0">
            С вашего разрешения подключаем Яндекс Метрику со статистикой
            посещений и Вебвизором.
          </template>
          <NuxtLink to="/cookie-policy" class="text-link"
            >Подробнее о cookie</NuxtLink
          >.
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
  inset: auto 1rem 1rem;
  max-width: 44rem;
  margin-inline: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 0.5rem 2rem #0002;
}
.analytics-consent p {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.6;
}
.analytics-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .analytics-consent {
    flex-direction: column;
    align-items: stretch;
  }
  .analytics-actions {
    justify-content: flex-end;
  }
}
</style>
