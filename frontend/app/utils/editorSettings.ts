export interface EditorSettings {
  tabWidth: 2 | 4 | 8
  useTabs: boolean
  printWidth: 80 | 100 | 120
  singleQuote: boolean
  semi: boolean
  autoFormat: boolean
  lineWrapping: boolean
  fontSize: 12 | 14 | 16 | 18
}
export const EDITOR_SETTINGS_KEY = 'jslab:editor-settings:v1'
export const DEFAULT_EDITOR_SETTINGS: Readonly<EditorSettings> = Object.freeze({
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  singleQuote: true,
  semi: true,
  autoFormat: true,
  lineWrapping: false,
  fontSize: 14,
})
export function editorSettings(value: unknown): EditorSettings {
  const input =
    value && typeof value === 'object' ? (value as Partial<EditorSettings>) : {}
  return {
    tabWidth: [2, 4, 8].includes(Number(input.tabWidth))
      ? (Number(input.tabWidth) as EditorSettings['tabWidth'])
      : 2,
    printWidth: [80, 100, 120].includes(Number(input.printWidth))
      ? (Number(input.printWidth) as EditorSettings['printWidth'])
      : 80,
    fontSize: [12, 14, 16, 18].includes(Number(input.fontSize))
      ? (Number(input.fontSize) as EditorSettings['fontSize'])
      : 14,
    useTabs: typeof input.useTabs === 'boolean' ? input.useTabs : false,
    singleQuote:
      typeof input.singleQuote === 'boolean' ? input.singleQuote : true,
    semi: typeof input.semi === 'boolean' ? input.semi : true,
    autoFormat: typeof input.autoFormat === 'boolean' ? input.autoFormat : true,
    lineWrapping:
      typeof input.lineWrapping === 'boolean' ? input.lineWrapping : false,
  }
}
