import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {execute} from '../nsjail.mjs';

test('native cancellation and overflow stop the complete bounded job',async()=>{
  for(const overflow of [false,true]){
    const calls=[];
    const spawnProcess=(command,args)=>{
      calls.push({command,args});
      const child=new EventEmitter();
      child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>{};
      if(overflow&&args[2]==='start')setImmediate(()=>child.stdout.write('x'.repeat(33000)));
      return child;
    };
    const job={code:'function solve(){return 1}',language:'javascript',inputs:[[]]};
    const result=await execute(job,{spawnProcess,timeoutMs:15});
    assert.equal(result.ok,false);
    assert.equal(calls.length,2);
    assert.equal(calls[0].command,'sudo');
    assert.equal(calls[0].args[1],'/usr/local/sbin/jslab-jail');
    assert.equal(calls[1].args[2],'stop');
    assert.match(calls[1].args[3],/^[a-f0-9]{32}$/);
    assert.equal(calls[0].args[3],calls[1].args[3]);
  }
});
