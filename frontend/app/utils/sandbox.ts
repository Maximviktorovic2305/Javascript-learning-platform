export function sandboxDocument(
  code: string,
  inputs: unknown[][],
  requestId: string,
): string {
  const encode = (value: string) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(value)))
  const source = `const logs=[]; const print=(...args)=>{if(logs.length<50) logs.push(args.map(v=>typeof v==='string'?v:JSON.stringify(v)).join(' ').slice(0,1000))}; console.log=print; console.error=print;\n${code}\n;(async()=>{if(typeof solve!=='function') throw new Error('Объявите функцию solve'); const inputs=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('${encode(JSON.stringify(inputs))}'),c=>c.charCodeAt(0)))); const outputs=[]; for(const args of inputs) outputs.push(await solve(...args)); postMessage({ok:true,outputs,logs});})().catch(error=>postMessage({ok:false,error:String(error).slice(0,1000)}));`
  const payload = encode(source)
  // Student source is a Worker payload in an opaque sandboxed frame. It cannot
  // access the app DOM, credentials or storage. CSP blocks every network request.
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-preview' blob:; worker-src blob:; connect-src 'none'"><script nonce="preview">const id=${JSON.stringify(requestId)};const worker=new Worker(URL.createObjectURL(new Blob([new TextDecoder().decode(Uint8Array.from(atob('${payload}'),c=>c.charCodeAt(0)))],{type:'text/javascript'})));const done=value=>{worker.terminate();parent.postMessage({id,...value},'*')};const timer=setTimeout(()=>done({ok:false,error:'Превышено время выполнения (3 секунды).'}),3000);worker.onmessage=e=>{clearTimeout(timer);done(e.data)};worker.onerror=()=>{clearTimeout(timer);done({ok:false,error:'Ошибка JavaScript. Проверьте синтаксис и функцию solve.'})};</script>`
}
export function isPreviewResult(value: unknown): value is {
  id: string
  ok: boolean
  outputs?: unknown[]
  logs?: string[]
  error?: string
} {
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('ok' in value) ||
    typeof value.ok !== 'boolean'
  )
    return false
  if (
    'outputs' in value &&
    (!Array.isArray(value.outputs) || value.outputs.length > 10)
  )
    return false
  if (
    'logs' in value &&
    (!Array.isArray(value.logs) ||
      value.logs.length > 50 ||
      !value.logs.every((v) => typeof v === 'string' && v.length <= 1000))
  )
    return false
  if (
    'error' in value &&
    (typeof value.error !== 'string' || value.error.length > 2000)
  )
    return false
  return true
}
