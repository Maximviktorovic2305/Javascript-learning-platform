<script setup lang="ts">
type Option = {
  value: string | number
  label: string
  disabled?: boolean
  icon?: 'filter' | 'clock' | 'check' | 'target' | 'zap' | 'book'
}
const props = defineProps<{
  modelValue: string | number
  options: Option[]
  label: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const uid = useId()
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const open = ref(false)
const active = ref(-1)
const selected = computed(() =>
  props.options.find((option) => option.value === props.modelValue),
)
const optionId = (index: number) => `${uid}-option-${index}`
function reveal() {
  if (props.disabled) return
  // Safari does not focus a button on pointer activation. Keep keyboard
  // navigation and Escape on the combobox after opening with the mouse.
  trigger.value?.focus()
  open.value = true
  const index = props.options.findIndex(
    (option) => option.value === props.modelValue && !option.disabled,
  )
  active.value =
    index >= 0 ? index : props.options.findIndex((option) => !option.disabled)
}
function choose(index: number) {
  const option = props.options[index]
  if (!option || option.disabled) return
  emit('update:modelValue', option.value)
  open.value = false
  trigger.value?.focus()
}
function move(direction: number) {
  for (let offset = 1; offset <= props.options.length; offset++) {
    const index =
      (active.value + direction * offset + props.options.length) %
      props.options.length
    if (!props.options[index]?.disabled) {
      active.value = index
      nextTick(() =>
        document
          .getElementById(optionId(index))
          ?.scrollIntoView({ block: 'nearest' }),
      )
      break
    }
  }
}
let search = ''
let lastKey = 0
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    return
  }
  if (event.key === 'Tab') {
    open.value = false
    return
  }
  if (
    ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)
  ) {
    event.preventDefault()
    if (!open.value) {
      reveal()
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      choose(active.value)
      return
    }
    if (event.key === 'Home') {
      active.value = -1
      move(1)
      return
    }
    if (event.key === 'End') {
      active.value = 0
      move(-1)
      return
    }
    move(event.key === 'ArrowDown' ? 1 : -1)
  } else if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault()
    if (!open.value) reveal()
    const now = Date.now()
    search =
      (now - lastKey < 700 ? search : '') + event.key.toLocaleLowerCase('ru')
    lastKey = now
    const index = props.options.findIndex(
      (option) =>
        !option.disabled &&
        option.label.toLocaleLowerCase('ru').startsWith(search),
    )
    if (index >= 0) active.value = index
  }
}
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}
function blur(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null))
    open.value = false
}
watch(
  () => props.disabled,
  (value) => {
    if (value) open.value = false
  },
)
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>
<template>
  <div ref="root" class="app-select" @focusout="blur">
    <button
      ref="trigger"
      type="button"
      class="app-select-trigger"
      role="combobox"
      :disabled="disabled"
      :aria-label="label"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="`${uid}-listbox`"
      :aria-activedescendant="
        open && active >= 0 ? optionId(active) : undefined
      "
      @click="open ? (open = false) : reveal()"
      @keydown="keydown"
    >
      <AppIcon v-if="selected?.icon" :name="selected.icon" :size="16" />
      <span>{{ selected?.label ?? 'Выберите значение' }}</span>
      <AppIcon
        name="down"
        :size="16"
        class="select-chevron"
        :class="{ open }"
      />
    </button>
    <div
      v-if="open"
      :id="`${uid}-listbox`"
      class="app-select-menu"
      role="listbox"
      :aria-label="label"
    >
      <div
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option.value"
        role="option"
        class="app-select-option"
        :class="{ active: active === index }"
        :aria-selected="option.value === modelValue"
        :aria-disabled="option.disabled || undefined"
        @pointermove="!option.disabled && (active = index)"
        @pointerdown.prevent
        @click="choose(index)"
      >
        <AppIcon v-if="option.icon" :name="option.icon" :size="16" />
        <span>{{ option.label }}</span>
        <AppIcon
          v-if="option.value === modelValue"
          name="check"
          :size="15"
          class="select-check"
        />
      </div>
    </div>
  </div>
</template>
