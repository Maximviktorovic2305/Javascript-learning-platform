import { formatCode } from '../utils/formatCode'

self.onmessage = async (
  event: MessageEvent<{
    id: number
    source: string
    language: 'javascript' | 'typescript'
    cursorOffset: number
  }>,
) => {
  const { id, source, language, cursorOffset } = event.data
  try {
    const result = await formatCode(source, language, cursorOffset)
    self.postMessage({ id, ...result })
  } catch {
    self.postMessage({
      id,
      error: 'Не удалось отформатировать код. Проверьте синтаксис.',
    })
  }
}
