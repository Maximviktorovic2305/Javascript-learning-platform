type Command =
  | [number, 'init', Record<string, unknown>]
  | [number, 'hit', string, Record<string, unknown>]
  | [number, 'destruct']
type Counter = ((...args: Command) => void) & { a?: Command[]; l?: number }
declare global {
  interface Window {
    ym?: Counter
    dataLayer?: unknown[]
  }
}

export function analyticsUrl(value: string, origin: string): string {
  if (!value) return ''
  try {
    const url = new URL(value, origin)
    return ['https:', 'http:'].includes(url.protocol)
      ? url.origin + url.pathname
      : ''
  } catch {
    return ''
  }
}

// Created only after client mount; no shared state between SSR requests.
export function createMetrikaClient(win: Window, doc: Document) {
  let active: number | null = null
  let previous: string | null = null
  let stub: Counter | undefined
  let loaded = false
  const scriptId = 'jslab-metrika-sdk'
  const clean = (value: string) => analyticsUrl(value, win.location.origin)
  const stop = () => {
    if (active !== null) win.ym?.(active, 'destruct')
    if (win.ym === stub && stub) stub.a = []
    doc.getElementById(scriptId)?.remove()
    active = null
    previous = null
  }
  const start = (id: number) => {
    if (!Number.isSafeInteger(id) || id <= 0 || active === id) return
    if (active !== null) stop()
    if (!win.ym) {
      const queue: Counter = (...args) => {
        ;(queue.a ??= []).push(args)
      }
      queue.l = Date.now()
      stub = queue
      win.ym = queue
    }
    win.dataLayer ??= []
    active = id
    win.ym(id, 'init', {
      ssr: true,
      defer: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      accurateTrackBounce: true,
      trackLinks: true,
      sendTitle: false,
      referrer: clean(doc.referrer),
      url: clean(win.location.href),
    })
    if (loaded || doc.getElementById(scriptId)) return
    const script = doc.createElement('script')
    script.id = scriptId
    script.async = true
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${id}`
    script.onload = () => {
      loaded = true
    }
    script.onerror = () => {
      if (win.ym === stub && stub) stub.a = []
      active = null
      previous = null
      script.remove()
    }
    doc.head.append(script)
  }
  const page = (path: string) => {
    if (active === null || !win.ym) return
    const url = clean(path)
    if (url === previous) return
    win.ym(active, 'hit', url, { referer: previous ?? clean(doc.referrer) })
    previous = url
  }
  return { start, stop, page }
}
