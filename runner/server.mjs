import {createServer} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {execute as dockerExecute} from './docker.mjs';
import {execute as nativeExecute} from './nsjail.mjs';
const engine=process.env.SANDBOX_ENGINE??'docker';
if(!['docker','nsjail'].includes(engine))throw new Error('Invalid sandbox engine');
const execute=engine==='nsjail'?nativeExecute:dockerExecute;
export function validJob(value){return value&&typeof value==='object'&&typeof value.code==='string'&&value.code.length>0&&value.code.length<=20000&&['javascript','typescript'].includes(value.language)&&Array.isArray(value.inputs)&&value.inputs.length>=1&&value.inputs.length<=10&&value.inputs.every(v=>Array.isArray(v)&&v.length<=10)}
export function createRunnerServer(token,run=execute){
  if(typeof token!=='string'||token.length<32)throw new Error('RUNNER_TOKEN requires at least 32 characters');
  let active=0;
  return createServer(async(req,res)=>{
    res.setHeader('Content-Type','application/json');
    const reply=(code,data)=>{if(!res.destroyed){res.statusCode=code;res.end(JSON.stringify(data))}};
    const candidate=Buffer.from(req.headers.authorization??''),expected=Buffer.from(`Bearer ${token}`);
    if(candidate.length!==expected.length||!timingSafeEqual(candidate,expected))return reply(401,{error:'Unauthorized'});
    if(req.method!=='POST'||req.url!=='/execute')return reply(404,{error:'Not found'});
    if(active>=2)return reply(429,{error:'Runner busy'});
    if(!req.headers['content-type']?.startsWith('application/json'))return reply(415,{error:'JSON required'});
    active++;
    const controller=new AbortController();
    const cancel=()=>controller.abort();req.on('aborted',cancel);res.on('close',()=>{if(!res.writableEnded)cancel()});
    const timer=setTimeout(()=>{controller.abort();req.destroy()},20000);
    try{
      let size=0;const chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>64000){reply(413,{error:'Request too large'});req.destroy();return}chunks.push(chunk)}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{return reply(400,{error:'Invalid JSON'})}
      if(!validJob(body))return reply(400,{error:'Invalid job'});
      const result=await run(body,{signal:controller.signal});reply(200,result);
    }catch{reply(503,{error:'Runner unavailable'})}finally{active--;clearTimeout(timer);req.off('aborted',cancel)}
  });
}
if(process.env.NODE_ENV!=='test'){
  const server=createRunnerServer(process.env.RUNNER_TOKEN);
  server.listen(8092,process.env.RUNNER_HOST??'127.0.0.1');
  process.on('SIGTERM',()=>server.close());
}
