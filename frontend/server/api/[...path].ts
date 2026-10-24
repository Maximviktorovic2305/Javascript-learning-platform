export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const path = getRequestURL(event).pathname
  // The destination is configuration, never a user supplied URL. Preserve cookie,
  // Origin and CSRF headers; proxyRequest forwards Set-Cookie on the response.
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return proxyRequest(event, `${config.apiBase}${path}${getRequestURL(event).search}`, {headers:{'x-forwarded-for':getRequestIP(event)??''}})
})
