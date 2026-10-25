export async function formatCode(
  source: string,
  language: 'javascript' | 'typescript',
  cursorOffset = 0,
) {
  if (source.length > 20000) throw new Error('Код превышает 20 000 символов.')
  const [prettier, estree, parser] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/estree'),
    language === 'typescript'
      ? import('prettier/plugins/typescript')
      : import('prettier/plugins/babel'),
  ])
  return prettier.formatWithCursor(source, {
    parser: language === 'typescript' ? 'typescript' : 'babel',
    plugins: [estree, parser],
    cursorOffset: Math.max(0, Math.min(cursorOffset, source.length)),
    singleQuote: true,
    semi: true,
    tabWidth: 2,
    printWidth: 80,
    endOfLine: 'lf',
  })
}
