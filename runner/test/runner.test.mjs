import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {execute,dockerArgs} from '../docker.mjs';
process.env.NODE_ENV='test';
const {createRunnerServer,validJob}=await import('../server.mjs');
test('job validation and Docker limits reject unsafe job shapes',()=>{
  assert.equal(validJob({code:'x',language:'python',inputs:[[]]}),false);
  assert.equal(validJob({code:'x'.repeat(20001),language:'javascript',inputs:[[]]}),false);
  assert.equal(validJob({code:'function solve(){}',language:'javascript',inputs:[[]]}),true);
  const args=dockerArgs('test');
  for(const flag of ['--read-only','--cap-drop','--pids-limit','--memory','--cpus','--network','--user','--tmpfs'])assert.ok(args.includes(flag));
  assert.equal(args[args.indexOf('--network')+1],'none');
  assert.ok(!args.some(a=>a.includes('docker.sock')));
});
test('timeout and output overflow always remove the disposable container',async()=>{
  for(const overflow of [false,true]){
    const calls=[];
    const spawnProcess=(cmd,args)=>{
      calls.push(args);const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{};
      if(overflow&&args[0]==='run')setImmediate(()=>child.stdout.write('x'.repeat(33000)));
      return child;
    };
    const result=await execute({code:'unused',language:'javascript',inputs:[[]]},{spawnProcess,timeoutMs:15});
    assert.equal(result.ok,false);assert.ok(calls.some(args=>args[0]==='rm'&&args[1]==='-f'));
  }
});
test('broker authentication, input bounds and saturation',async()=>{
  const token='t'.repeat(32);let release;
  const server=createRunnerServer(token,async()=>new Promise(resolve=>{release=resolve}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const headers={authorization:`Bearer ${token}`,'content-type':'application/json'};
  try{
    assert.equal((await fetch(base+'/execute',{method:'POST',body:'{}'})).status,401);
    assert.equal((await fetch(base+'/execute',{method:'POST',headers,body:'{bad'})).status,400);
    assert.equal((await fetch(base+'/execute',{method:'POST',headers,body:JSON.stringify({code:'x',language:'javascript',inputs:[]})})).status,400);
    const responsePromise=fetch(base+'/execute',{method:'POST',headers,body:JSON.stringify({code:'unused',language:'javascript',inputs:[[]]})});
    await new Promise(resolve=>setTimeout(resolve,15));release({ok:true,outputs:[42]});
    assert.deepEqual(await (await responsePromise).json(),{ok:true,outputs:[42]});
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
});
