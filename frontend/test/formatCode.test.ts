import { describe, expect, it } from 'vitest'
import { formatCode } from '../app/utils/formatCode'
import {
  DEFAULT_EDITOR_SETTINGS,
  editorSettings,
} from '../app/utils/editorSettings'

describe('Prettier formats student code without executing it', () => {
  it('applies the visible indentation, quotes and semicolon preferences', async () => {
    const source = 'function solve(){return "JS"}'
    const spaces = await formatCode(source, 'javascript', 0, {
      ...DEFAULT_EDITOR_SETTINGS,
      tabWidth: 4,
      singleQuote: false,
      semi: false,
    })
    expect(spaces.formatted).toBe('function solve() {\n    return "JS"\n}\n')
    const tabs = await formatCode(source, 'javascript', 0, {
      ...DEFAULT_EDITOR_SETTINGS,
      useTabs: true,
      tabWidth: 8,
    })
    expect(tabs.formatted).toBe("function solve() {\n\treturn 'JS';\n}\n")
    const wideSource =
      "const result = build('123456789012345', '123456789012345', '123456789012345', '123456789012345');"
    const narrow = await formatCode(wideSource, 'javascript', 0, {
      printWidth: 80,
    })
    const wide = await formatCode(wideSource, 'javascript', 0, {
      printWidth: 120,
    })
    expect(narrow.formatted).toContain('build(\n')
    expect(wide.formatted).not.toContain('build(\n')
    expect(
      editorSettings({
        tabWidth: 999,
        fontSize: -1,
        useTabs: 'true',
        printWidth: 0,
      }),
    ).toEqual(DEFAULT_EDITOR_SETTINGS)
  })
  it('formats JavaScript and preserves comments, strings and cursor tracking', async () => {
    const source = 'function solve(name){/* note */return "Привет, "+name+"!"}'
    const result = await formatCode(
      source,
      'javascript',
      source.indexOf('return'),
    )
    expect(result.formatted).toContain('\n  /* note */')
    expect(result.formatted).toContain("return 'Привет, ' + name + '!';")
    expect(result.cursorOffset).toBeGreaterThan(0)
    expect((await formatCode(result.formatted, 'javascript')).formatted).toBe(
      result.formatted,
    )
  })
  it('handles strict TypeScript and Nest decorators', async () => {
    const result = await formatCode(
      '@Module({providers:[]}) class AppModule{}\nasync function solve(value:number):Promise<number>{return value*2}',
      'typescript',
    )
    expect(result.formatted).toContain('value: number')
    expect(result.formatted).toContain('Promise<number>')
    expect(result.formatted).toContain('@Module({ providers: [] })')
  })
  it('rejects broken syntax or oversized input without inventing a result', async () => {
    await expect(
      formatCode('function solve( {', 'javascript'),
    ).rejects.toThrow()
    await expect(formatCode(' '.repeat(20001), 'javascript')).rejects.toThrow(
      '20 000',
    )
  })
  it('treats executable-looking source solely as text', async () => {
    const marker = { executed: false }
    Object.assign(globalThis, { __formatterTest: marker })
    await formatCode(
      'globalThis.__formatterTest.executed=true; function solve(){return "</script>"}',
      'javascript',
    )
    expect(marker.executed).toBe(false)
    Reflect.deleteProperty(globalThis, '__formatterTest')
  })
})
