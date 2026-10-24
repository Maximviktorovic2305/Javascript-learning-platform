// This program ONLY runs inside the disposable, networkless Docker sandbox.
// Expected answers never enter this container; the API compares its outputs.
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const main=async()=>{
  const chunks=[];
  for await(const chunk of process.stdin)chunks.push(chunk);
  const job=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  fs.mkdirSync('/tmp/work',{recursive:true});
  fs.symlinkSync('/opt/app/node_modules','/tmp/work/node_modules','dir');
  const source=job.code+'\n;module.exports = solve;\n';
  let js=source;
  if(job.language==='typescript'){
    const file='/tmp/work/solution.ts';
    fs.writeFileSync(file,source);
    const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,strict:true,skipLibCheck:true,esModuleInterop:true,experimentalDecorators:true,emitDecoratorMetadata:true,noEmitOnError:true,outDir:'/tmp/work/compiled',typeRoots:['/opt/app/node_modules/@types']};
    const program=ts.createProgram([file],options);
    const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
    if(errors.length)throw new Error(errors.slice(0,8).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'));
    program.emit();
    js=fs.readFileSync('/tmp/work/compiled/solution.js','utf8');
  }
  const filename='/tmp/work/solution.cjs';
  fs.writeFileSync(filename,js);
  console.log=()=>{};console.info=()=>{};console.warn=()=>{};console.error=()=>{};
  const solve=require(filename);
  if(typeof solve!=='function')throw new Error('Объявите функцию solve');
  const outputs=[];
  for(const args of job.inputs)outputs.push(await solve(...args));
  const payload=JSON.stringify({ok:true,outputs});
  if(payload.length>24000)throw new Error('Слишком большой результат');
  process.stdout.write(payload);
};
main().then(()=>process.exit(0)).catch(error=>{process.stdout.write(JSON.stringify({ok:false,error:String(error.message??error).slice(0,1800)}));process.exit(0)});
