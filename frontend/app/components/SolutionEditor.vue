<script setup lang="ts">
import { basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab, isolateHistory } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import {
  HighlightStyle,
  syntaxHighlighting,
  indentUnit,
} from '@codemirror/language'
import { tags } from '@lezer/highlight'
import {
  DEFAULT_EDITOR_SETTINGS,
  EDITOR_SETTINGS_KEY,
  editorSettings,
} from '~/utils/editorSettings'

const props = defineProps<{
  modelValue: string
  language: 'javascript' | 'typescript'
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; run: [] }>()
const host = useTemplateRef<HTMLDivElement>('host')
const formatting = ref(false)
const message = ref('')
const language = new Compartment()
const configuration = new Compartment()
const settings = ref(editorSettings(DEFAULT_EDITOR_SETTINGS))
const settingsOpen = ref(false)
const panelId = useId()
const settingsRevision = ref(0)
let view: EditorView | undefined
let worker: Worker | undefined
let requestId = 0
let pending:
  | {
      id: number
      resolve: (value: boolean) => void
      timer: ReturnType<typeof setTimeout>
    }
  | undefined
let activeFormat: Promise<boolean> | undefined
let reportErrors = false
let mounted = false

const colors = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], color: '#c5a8ff' },
  { tag: [tags.string, tags.regexp], color: '#c7e894' },
  { tag: [tags.number, tags.bool, tags.null], color: '#f3bc81' },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: '#f4dfa1',
  },
  { tag: [tags.typeName, tags.className], color: '#8fd4e0' },
  { tag: tags.comment, color: '#9aaa8c', fontStyle: 'italic' },
  { tag: [tags.operator, tags.punctuation], color: '#becab4' },
])

function endFormatting(success: boolean) {
  if (!pending) return
  clearTimeout(pending.timer)
  const { resolve } = pending
  pending = undefined
  formatting.value = false
  resolve(success)
}

function format(silent = false): Promise<boolean> {
  if (!view || !mounted) return Promise.resolve(false)
  if (activeFormat) {
    reportErrors ||= !silent
    return activeFormat
  }
  reportErrors = !silent
  const editor = view
  const source = editor.state.doc.toString()
  const cursorOffset = editor.state.selection.main.head
  const revision = settingsRevision.value
  if (!source.trim()) return Promise.resolve(true)
  message.value = ''
  formatting.value = true
  const promise = new Promise<boolean>((resolve) => {
    const id = ++requestId
    const timer = setTimeout(() => {
      worker?.terminate()
      worker = undefined
      if (reportErrors)
        message.value =
          'Форматирование заняло слишком много времени. Попробуйте ещё раз.'
      endFormatting(false)
    }, 5000)
    pending = { id, resolve, timer }
    try {
      worker ??= new Worker(
        new URL('../workers/format.worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.onmessage = (
        event: MessageEvent<{
          id: number
          formatted?: string
          cursorOffset?: number
          error?: string
        }>,
      ) => {
        if (event.data.id !== pending?.id || !mounted) return
        if (event.data.error) {
          if (reportErrors) message.value = event.data.error
          endFormatting(false)
          return
        }
        const formatted = event.data.formatted
        // A delayed formatter must never overwrite typing, a reset, or another lesson.
        if (
          typeof formatted !== 'string' ||
          formatted.length > 20000 ||
          editor.state.doc.toString() !== source ||
          settingsRevision.value !== revision
        ) {
          endFormatting(false)
          return
        }
        if (formatted !== source)
          editor.dispatch({
            changes: {
              from: 0,
              to: editor.state.doc.length,
              insert: formatted,
            },
            selection: {
              anchor: Math.min(
                event.data.cursorOffset ?? cursorOffset,
                formatted.length,
              ),
            },
            userEvent: 'input.format',
            annotations: isolateHistory.of('full'),
          })
        endFormatting(true)
      }
      worker.onerror = () => {
        if (pending?.id !== id) return
        if (reportErrors)
          message.value =
            'Форматирование недоступно. Код сохранён без изменений.'
        worker?.terminate()
        worker = undefined
        endFormatting(false)
      }
      worker.postMessage({
        id,
        source,
        language: props.language,
        cursorOffset,
        settings: { ...settings.value },
      })
    } catch {
      if (reportErrors)
        message.value = 'Форматирование недоступно. Код сохранён без изменений.'
      endFormatting(false)
    }
  })
  activeFormat = promise.finally(() => {
    activeFormat = undefined
  })
  return activeFormat
}

onMounted(() => {
  if (!host.value) return
  mounted = true
  try {
    settings.value = editorSettings(
      JSON.parse(localStorage.getItem(EDITOR_SETTINGS_KEY) ?? 'null'),
    )
  } catch {
    /* Defaults work without storage. */
  }
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              emit('run')
              return true
            },
          },
          {
            key: 'Alt-Shift-f',
            run: () => {
              void format()
              return true
            },
          },
          indentWithTab,
        ]),
        basicSetup,
        language.of(
          javascript({ typescript: props.language === 'typescript' }),
        ),
        configuration.of(editorConfiguration()),
        syntaxHighlighting(colors),
        EditorView.contentAttributes.of({
          'aria-label': 'Редактор решения',
          'aria-description':
            'Tab — отступ. Escape, затем Tab — перейти к следующему элементу. Alt+Shift+F — форматировать код.',
          spellcheck: 'false',
          autocapitalize: 'off',
          class: 'ym-disable-keys',
        }),
        EditorState.transactionFilter.of((transaction) =>
          transaction.newDoc.length <= 20000 ? transaction : [],
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            message.value = ''
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
        EditorView.domEventHandlers({
          blur: (event) => {
            if (
              event.relatedTarget instanceof Element &&
              event.relatedTarget.closest(
                '.editor-format-bar, .editor-settings',
              )
            )
              return
            if (settings.value.autoFormat) void format(true)
          },
          paste: () => {
            setTimeout(() => {
              if (mounted && settings.value.autoFormat) void format(true)
            }, 0)
            return false
          },
        }),
        EditorView.theme(
          {
            '&': {
              backgroundColor: '#151a13',
              color: '#e3eadc',
            },
            '.cm-scroller': {
              fontFamily: 'var(--mono)',
              lineHeight: '1.9',
              overflow: 'auto',
              minHeight: '310px',
              maxHeight: '620px',
            },
            '.cm-content': { padding: '18px 0', caretColor: '#c7f55b' },
            '.cm-line': { padding: '0 16px 0 8px' },
            '.cm-gutters': {
              backgroundColor: '#151a13',
              color: '#9aaa8c',
              border: 'none',
              paddingRight: '8px',
            },
            '.cm-activeLineGutter, .cm-activeLine': {
              backgroundColor: '#21291c',
            },
            '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#c7f55b' },
            '&.cm-focused': { outline: 'none' },
            '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
              backgroundColor: '#3c502b !important',
            },
            '.cm-tooltip': {
              backgroundColor: '#232d1c',
              color: '#e3eadc',
              borderColor: '#657556',
            },
            '.cm-panels': { backgroundColor: '#232d1c', color: '#e3eadc' },
          },
          { dark: true },
        ),
      ],
    }),
  })
})

function editorConfiguration() {
  return [
    indentUnit.of(
      settings.value.useTabs ? '\t' : ' '.repeat(settings.value.tabWidth),
    ),
    EditorState.tabSize.of(settings.value.tabWidth),
    settings.value.lineWrapping ? EditorView.lineWrapping : [],
    EditorView.theme({ '&': { fontSize: `${settings.value.fontSize}px` } }),
  ]
}
watch(
  settings,
  (value) => {
    settingsRevision.value++
    view?.dispatch({
      effects: configuration.reconfigure(editorConfiguration()),
    })
    if (mounted)
      try {
        localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(value))
      } catch {
        message.value =
          'Настройки применены, но не сохранены: хранилище недоступно.'
      }
  },
  { deep: true },
)
function resetSettings() {
  settings.value = editorSettings(DEFAULT_EDITOR_SETTINGS)
}

watch(
  () => props.modelValue,
  (value) => {
    if (view && value !== view.state.doc.toString())
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      })
  },
)
watch(
  () => props.language,
  (value) =>
    view?.dispatch({
      effects: language.reconfigure(
        javascript({ typescript: value === 'typescript' }),
      ),
    }),
)
onBeforeUnmount(() => {
  mounted = false
  endFormatting(false)
  worker?.terminate()
  view?.destroy()
})
defineExpose({ format })
</script>

<template>
  <div class="solution-editor">
    <div class="editor-format-bar">
      <strong class="editor-prettier-label">Prettier</strong>
      <label class="editor-indent-setting"
        >Отступ
        <select v-model.number="settings.tabWidth" aria-label="Размер отступа">
          <option :value="2">
            {{ settings.useTabs ? 'Tab: 2 позиции' : '2 пробела' }}
          </option>
          <option :value="4">
            {{ settings.useTabs ? 'Tab: 4 позиции' : '4 пробела' }}
          </option>
          <option :value="8">
            {{ settings.useTabs ? 'Tab: 8 позиций' : '8 пробелов' }}
          </option>
        </select>
      </label>
      <button
        type="button"
        class="button button-small button-outline"
        :aria-expanded="settingsOpen"
        :aria-controls="panelId"
        @click="settingsOpen = !settingsOpen"
      >
        Настройки редактора
      </button>
      <button
        type="button"
        class="button button-small button-outline"
        :aria-busy="formatting"
        title="Alt + Shift + F"
        @mousedown.prevent
        @click="format()"
      >
        <AppIcon
          :name="formatting ? 'loading' : 'braces'"
          :class="{ spin: formatting }"
          :size="15"
        />
        {{ formatting ? 'Форматируем…' : 'Форматировать' }}
      </button>
    </div>
    <section
      v-if="settingsOpen"
      :id="panelId"
      class="editor-settings"
      aria-label="Настройки Prettier и редактора"
    >
      <div class="editor-settings-grid">
        <label
          >Тип отступа<select
            v-model="settings.useTabs"
            aria-label="Тип отступа"
          >
            <option :value="false">Пробелы</option>
            <option :value="true">Табуляция</option>
          </select></label
        >
        <label
          >Длина строки<select
            v-model.number="settings.printWidth"
            aria-label="Длина строки Prettier"
          >
            <option :value="80">80 символов</option>
            <option :value="100">100 символов</option>
            <option :value="120">120 символов</option>
          </select></label
        >
        <label
          >Размер шрифта<select
            v-model.number="settings.fontSize"
            aria-label="Размер шрифта редактора"
          >
            <option :value="12">12 px</option>
            <option :value="14">14 px</option>
            <option :value="16">16 px</option>
            <option :value="18">18 px</option>
          </select></label
        >
        <label
          >Кавычки<select
            v-model="settings.singleQuote"
            aria-label="Кавычки Prettier"
          >
            <option :value="true">Одинарные</option>
            <option :value="false">Двойные</option>
          </select></label
        >
      </div>
      <label class="editor-setting-check"
        ><input v-model="settings.semi" type="checkbox" />Точки с запятой</label
      >
      <label class="editor-setting-check"
        ><input
          v-model="settings.autoFormat"
          type="checkbox"
        />Автоформатирование при вставке и выходе из редактора</label
      >
      <label class="editor-setting-check"
        ><input v-model="settings.lineWrapping" type="checkbox" />Переносить
        длинные строки на экране</label
      >
      <button type="button" class="text-link" @click="resetSettings">
        Сбросить настройки редактора
      </button>
      <p>
        Настройки сохраняются на этом устройстве. Prettier применяется также
        перед запуском; форматирование можно отменить через Ctrl + Z.
      </p>
    </section>
    <div ref="host" class="solution-editor-host" />
    <p v-if="message" class="editor-format-message" role="status">
      {{ message }}
    </p>
  </div>
</template>
