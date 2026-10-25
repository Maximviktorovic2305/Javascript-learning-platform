export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html, { event }) => {
    const nonce = event.context.cspNonce as string | undefined
    if (!nonce) return
    html.head.unshift(`<meta name="csp-nonce" content="${nonce}">`)
    // Nonce only framework/head-generated tags, including the CSR shell.
    // Never bless scripts inside SSR body markup: an HTML injection must stay blocked.
    for (const key of ['head', 'bodyPrepend', 'bodyAppend'] as const) {
      html[key] = html[key].map((chunk) =>
        chunk.replace(
          /<script\b([^>]*)>/gi,
          (_tag, attributes: string) =>
            `<script${attributes.replace(/\snonce\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')} nonce="${nonce}">`,
        ),
      )
    }
  })
})
