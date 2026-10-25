import { formatCode } from '../utils/formatCode'
import type { EditorSettings } from '../utils/editorSettings'

self.onmessage = async (
  event: MessageEvent<{
    id: number
    source: string
    language: 'javascript' | 'typescript'
    cursorOffset: number
    settings: EditorSettings
  }>,
) => {
  const { id, source, language, cursorOffset, settings } = event.data
  try {
    const result = await formatCode(source, language, cursorOffset, settings)
    self.postMessage({ id, ...result })
  } catch {
    self.postMessage({
      id,
      error: 'Не удалось отформатировать код. Проверьте синтаксис.',
    })
  }
}
