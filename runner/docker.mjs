import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
export const image='script-lab-sandbox:1';
export function dockerArgs(name){return ['run','--rm','-i','--name',name,'--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--pids-limit','64','--memory','384m','--memory-swap','384m','--cpus','0.75','--ulimit','nofile=128:128','--user','65534:65534','--tmpfs','/tmp:rw,noexec,nosuid,size=32m,mode=1777',image]}
export async function execute(job,{signal,spawnProcess=spawn,timeoutMs=15000}={}){
  const name=`sl-${randomUUID()}`;
  return new Promise(resolve=>{
    const child=spawnProcess('docker',dockerArgs(name),{stdio:['pipe','pipe','pipe'],windowsHide:true});
    let bytes=0,output='',done=false;
    const finish=(result,kill=false)=>{
      if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);
      if(kill){child.kill();const cleanup=spawnProcess('docker',['rm','-f',name],{stdio:'ignore',windowsHide:true});cleanup.on('error',()=>{});}
      resolve(result);
    };
    const cancel=()=>finish({ok:false,error:'Выполнение отменено.'},true);
    const timer=setTimeout(()=>finish({ok:false,error:'Превышено время выполнения.'},true),timeoutMs);
    if(signal?.aborted)return cancel();
    signal?.addEventListener('abort',cancel,{once:true});
    child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>32000)return finish({ok:false,error:'Превышен лимит вывода.'},true);output+=chunk.toString()});
    child.stderr.on('data',chunk=>{bytes+=chunk.length;if(bytes>32000)finish({ok:false,error:'Превышен лимит вывода.'},true)});
    child.stdin.on('error',()=>{});
    child.on('error',()=>finish({ok:false,error:'Песочница недоступна.'},true));
    child.on('close',code=>{
      if(code!==0)return finish({ok:false,error:'Ошибка изолированного процесса.'});
      try{const result=JSON.parse(output);if(typeof result!=='object'||result===null||typeof result.ok!=='boolean')throw new Error();finish(result)}catch{finish({ok:false,error:'Некорректный результат программы.'})}
    });
    child.stdin.end(JSON.stringify(job));
  });
}
