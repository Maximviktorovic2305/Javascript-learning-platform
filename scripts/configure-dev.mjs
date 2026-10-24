import {randomBytes} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
if(existsSync('.env')){console.log('Existing .env preserved.');process.exit(0)}
writeFileSync('.env',`FRONTEND_PORT=3020\nALLOWED_ORIGIN=http://localhost:3020\nPOSTGRES_PASSWORD=${randomBytes(24).toString('hex')}\nCOOKIE_SECURE=false\nEXECUTION_RUNNER=remote\nRUNNER_TOKEN=${randomBytes(32).toString('hex')}\n`,{mode:0o600});
console.log('Created local .env. Secrets were not printed.');
