<script setup lang="ts">
import type { Exercise, Grade } from '#shared/types/api'
import { sandboxDocument, isPreviewResult } from '~/utils/sandbox'
const props = defineProps<{ exercise: Exercise }>()
const emit = defineEmits<{ graded: [result: Grade] }>()
const { user } = useSession()
const api = useApi()
const code = ref(props.exercise.starterCode)
const busy = ref(false)
const running = ref(false)
const output = ref<string[]>([])
const error = ref('')
const grade = ref<Grade | null>(null)
const hint = ref(false)
const frame = useTemplateRef<HTMLIFrameElement>('sandbox')
const editor = useTemplateRef<HTMLTextAreaElement>('editor')
const lineNumbers = useTemplateRef<HTMLDivElement>('lines')
const srcdoc = ref('')
let requestId = ''
let runGeneration = 0
let timeout: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
const draftKey = computed(
  () => `sl:draft:${user.value?.id ?? 'guest'}:${props.exercise.id}`,
)
const status = ref('')
function restoreDraft() {
  stop()
  controller?.abort()
  busy.value = false
  grade.value = null
  error.value = ''
  output.value = []
  code.value = props.exercise.starterCode
  try {
    const draft = localStorage.getItem(draftKey.value)
    if (draft && draft.length <= 20000) code.value = draft
  } catch {
    status.value = 'Сохранение черновиков недоступно в этом браузере.'
  }
}
function saveDraft() {
  try {
    localStorage.setItem(draftKey.value, code.value)
    status.value = 'Черновик сохранён на устройстве'
  } catch {
    status.value = 'Черновик не сохранён: хранилище недоступно.'
  }
}
watch(code, () => {
  grade.value = null
  if (import.meta.client) saveDraft()
})
watch(draftKey, () => {
  if (import.meta.client) restoreDraft()
})
onMounted(() => {
  restoreDraft()
  window.addEventListener('message', receive)
})
onBeforeUnmount(() => {
  stop()
  controller?.abort()
  window.removeEventListener('message', receive)
})
function stop() {
  runGeneration++
  clearTimeout(timeout)
  running.value = false
  srcdoc.value = ''
  requestId = ''
}
function receive(event: MessageEvent<unknown>) {
  if (
    event.source !== frame.value?.contentWindow ||
    event.origin !== 'null' ||
    !isPreviewResult(event.data) ||
    event.data.id !== requestId
  )
    return
  const result = event.data
  if (result.ok)
    output.value = [
      ...(result.logs ?? []),
      ...(result.outputs ?? []).map(
        (value, index) =>
          `Пример ${index + 1}: ${JSON.stringify(value) ?? 'undefined'}`,
      ),
    ]
  else error.value = result.error ?? 'Ошибка выполнения'
  stop()
}
async function run() {
  if (props.exercise.runtime === 'node') {
    error.value =
      'Это задание использует Node.js. Нажмите «Проверить решение» для запуска на сервере.'
    return
  }
  error.value = ''
  output.value = []
  running.value = true
  const generation = ++runGeneration
  try {
    let source = code.value
    if (props.exercise.language === 'typescript') {
      const ts = await import('typescript')
      if (generation !== runGeneration) return
      const result = ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.None,
        },
        reportDiagnostics: true,
      })
      const diagnostics =
        result.diagnostics?.filter(
          (d) => d.category === ts.DiagnosticCategory.Error,
        ) ?? []
      if (diagnostics.length)
        throw new Error(
          diagnostics
            .map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' '))
            .join('\n'),
        )
      source = result.outputText
    }
    requestId = crypto.randomUUID()
    srcdoc.value = sandboxDocument(
      source,
      props.exercise.examples.map((e) => e.input),
      requestId,
    )
    timeout = setTimeout(() => {
      stop()
      error.value = 'Запуск остановлен по таймауту.'
    }, 5000)
  } catch (e) {
    stop()
    error.value = e instanceof Error ? e.message : 'Не удалось запустить код'
  }
}
async function submit() {
  if (!user.value) {
    await navigateTo('/auth/login')
    return
  }
  const owner = user.value.id
  busy.value = true
  error.value = ''
  grade.value = null
  controller = new AbortController()
  try {
    const result = await api<Grade>(`/learning/${props.exercise.id}/submit`, {
      method: 'POST',
      body: { code: code.value, language: props.exercise.language },
      signal: controller.signal,
    })
    if (user.value?.id !== owner) return
    grade.value = result
    emit('graded', result)
    await refreshNuxtData(`private:progress:${owner}`)
  } catch (e) {
    if (!controller.signal.aborted) error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
function reset() {
  code.value = props.exercise.starterCode
  error.value = ''
  output.value = []
  grade.value = null
}
function syncScroll() {
  if (lineNumbers.value && editor.value)
    lineNumbers.value.scrollTop = editor.value.scrollTop
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Tab' && !event.shiftKey && editor.value) {
    event.preventDefault()
    const start = editor.value.selectionStart
    code.value =
      code.value.slice(0, start) +
      '  ' +
      code.value.slice(editor.value.selectionEnd)
    nextTick(() => {
      editor.value?.setSelectionRange(start + 2, start + 2)
    })
  }
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    void run()
  }
}
</script>
<template>
  <div class="practice-instructions">
    <p>{{ exercise.prompt }}</p>
    <div class="example-grid">
      <div
        v-for="(example, index) in exercise.examples"
        :key="index"
        class="example"
      >
        <span>Пример {{ index + 1 }}</span
        ><code
          >solve({{
            example.input.map((value) => JSON.stringify(value)).join(', ')
          }})</code
        ><code class="accent-text"
          >→ {{ JSON.stringify(example.expected) }}</code
        >
      </div>
    </div>
    <button class="hint-button" :aria-expanded="hint" @click="hint = !hint">
      <AppIcon name="help" :size="16" />{{
        hint ? 'Скрыть подсказку' : 'Нужна подсказка?'
      }}
    </button>
    <p v-if="hint" class="hint-box">{{ exercise.hint }}</p>
  </div>
  <div class="code-workspace">
    <div class="editor-top">
      <span class="window-dots"><i /><i /><i /></span
      ><span
        >solution.{{ exercise.language === 'typescript' ? 'ts' : 'js' }}</span
      ><span class="editor-lang">{{
        exercise.runtime === 'node' ? 'Node.js' : exercise.language
      }}</span
      ><button
        class="icon-button"
        aria-label="Сбросить код к заготовке"
        @click="reset"
      >
        <AppIcon name="reset" :size="15" />
      </button>
    </div>
    <div class="code-input-wrap">
      <div ref="lines" class="line-numbers" aria-hidden="true">
        <div v-for="number in code.split('\n').length" :key="number">
          {{ number }}
        </div>
      </div>
      <textarea
        ref="editor"
        v-model="code"
        class="code-input"
        aria-label="Редактор решения"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :maxlength="20000"
        @keydown="keydown"
        @scroll="syncScroll"
      />
    </div>
    <div class="editor-toolbar">
      <span>{{ status || 'Функция solve · Ctrl + Enter для запуска' }}</span>
      <div>
        <button
          v-if="running"
          class="button button-small button-outline"
          @click="stop"
        >
          Остановить</button
        ><button
          v-else
          class="button button-small button-outline"
          :disabled="busy || exercise.runtime === 'node'"
          @click="run"
        >
          <AppIcon name="play" :size="15" />Запустить примеры</button
        ><button
          class="button button-small"
          :disabled="busy || running"
          @click="submit"
        >
          <AppIcon
            :name="busy ? 'loading' : 'check'"
            :class="{ spin: busy }"
            :size="16"
          />{{ busy ? 'Проверяем…' : 'Проверить решение' }}
        </button>
      </div>
    </div>
  </div>
  <div class="console-panel" aria-live="polite">
    <div class="console-title">
      <AppIcon name="terminal" :size="16" />Результат
    </div>
    <p v-if="!output.length && !error && !grade" class="muted">
      {{
        exercise.runtime === 'node'
          ? 'Express и NestJS запускаются в серверной песочнице.'
          : 'Запусти примеры или отправь решение на проверку.'
      }}
    </p>
    <pre v-for="(line, index) in output" :key="index">{{ line }}</pre>
    <p v-if="error" role="alert" class="error-text">{{ error }}</p>
    <div v-if="grade" :class="grade.passed ? 'success-box' : 'error-box'">
      <strong>{{ grade.message }}</strong>
      <p v-if="grade.passed">
        {{ grade.xp ? `+${grade.xp} XP` : 'XP за эту задачу уже начислены' }}
      </p>
      <div class="test-pills">
        <span
          v-for="test in grade.tests"
          :key="test.index"
          :class="{ passed: test.passed }"
          ><AppIcon :name="test.passed ? 'check' : 'close'" :size="14" />Тест
          {{ test.index }}</span
        >
      </div>
    </div>
  </div>
  <p class="editor-note">
    Запуск примеров — самопроверка{{
      exercise.language === 'typescript' ? ', без полной проверки типов' : ''
    }}. XP начисляются после серверной проверки всех тестов.
  </p>
  <iframe
    ref="sandbox"
    :srcdoc="srcdoc"
    sandbox="allow-scripts"
    title="Изолированный запуск учебного кода"
    class="sandbox-frame"
  />
</template>
