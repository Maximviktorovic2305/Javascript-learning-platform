<script setup lang="ts">
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const id = useId()
const pinned = ref(false)
const hovered = ref(false)
const focused = ref(false)
const dismissed = ref(false)
const open = computed(
  () => !dismissed.value && (pinned.value || hovered.value || focused.value),
)
const route = useRoute()

function dismiss() {
  pinned.value = false
  focused.value = false
  dismissed.value = true
}

function close() {
  dismiss()
  trigger.value?.focus()
}

function toggle() {
  if (pinned.value) close()
  else {
    pinned.value = true
    dismissed.value = false
  }
}

function enter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  hovered.value = true
  dismissed.value = false
}

function leave() {
  hovered.value = false
}

function focusOut(event: FocusEvent) {
  if (
    !(event.relatedTarget instanceof Node) ||
    !root.value?.contains(event.relatedTarget)
  ) {
    focused.value = false
    dismissed.value = false
  }
}

function outside(event: PointerEvent) {
  if (
    open.value &&
    event.target instanceof Node &&
    !root.value?.contains(event.target)
  )
    dismiss()
}

function keydown(event: KeyboardEvent) {
  if (open.value && event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

watch(() => route.fullPath, dismiss)
onMounted(() => {
  document.addEventListener('pointerdown', outside)
  document.addEventListener('keydown', keydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside)
  document.removeEventListener('keydown', keydown)
})
</script>

<template>
  <div
    ref="root"
    class="author-support"
    @pointerenter="enter"
    @pointerleave="leave"
    @focusin="focused = true"
    @focusout="focusOut"
  >
    <section
      v-show="open"
      :id="`support-${id}`"
      class="support-panel"
      :aria-labelledby="`support-title-${id}`"
    >
      <button
        type="button"
        class="icon-button support-close"
        aria-label="Закрыть информацию о поддержке"
        @click="close"
      >
        <AppIcon name="close" :size="16" />
      </button>
      <h2 :id="`support-title-${id}`">Помогите музыке появиться</h2>
      <p>
        Вы можете поддержать автора добровольным донатом на создание и запись
        музыкального альбома.
      </p>
      <a
        class="button button-small"
        href="https://tips.yandex.ru/guest/payment/9462891"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Поддержать автора донатом — откроется в новой вкладке"
      >
        Поддержать донатом <AppIcon name="arrow" :size="15" />
      </a>
    </section>
    <button
      ref="trigger"
      type="button"
      class="support-trigger"
      aria-label="Поддержать автора"
      :aria-expanded="open"
      :aria-controls="`support-${id}`"
      @click="toggle"
    >
      <AppIcon name="heart" :size="21" />
    </button>
  </div>
</template>

<style scoped>
.author-support {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.support-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-ink);
  cursor: pointer;
}
.support-trigger:hover {
  filter: brightness(1.08);
}
.support-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 10px);
  width: min(320px, calc(100vw - 40px));
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  color: var(--ink);
}
.support-panel::after {
  content: '';
  position: absolute;
  inset: 100% 0 auto;
  height: 12px;
}
.support-panel h2 {
  margin: 0 18px 12px 0;
  font-size: 18px;
  line-height: 1.4;
  letter-spacing: -0.03em;
}
.support-panel p {
  margin: 0 0 18px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}
.support-close {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 26px;
  height: 26px;
}
@media (max-width: 640px) {
  .author-support {
    position: relative;
    inset: auto;
    margin: 0 20px 24px;
  }
}
</style>
