import { randomBytes } from 'node:crypto'
import { pageCsp } from '../../shared/csp'

export default defineEventHandler((event) => {
  if (import.meta.dev) return
  const path = getRequestURL(event).pathname
  if (/^\/(api(?:\/|$)|_nuxt\/|_ipx\/)/.test(path)) return
  if (
    /\.[a-z0-9]+$/i.test(path) &&
    !getHeader(event, 'accept')?.includes('text/html')
  )
    return
  const nonce = randomBytes(24).toString('base64')
  event.context.cspNonce = nonce
  setResponseHeader(event, 'Content-Security-Policy', pageCsp(nonce))
  // A per-document nonce must never be reused by a shared HTML cache.
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
})
