#!/usr/bin/python3 -I
"""Root-owned fixed operations; no caller-supplied paths or commands."""
import gzip
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

APP = Path('/home/max/jslab')
SERVICES = ['jslab-runner', 'jslab-api', 'jslab-web']

def environment(kind='api'):
    values = {'PATH': '/opt/jslab/node/bin:/usr/bin:/bin', 'LANG': 'C.UTF-8'}
    if kind not in {'api','migrate'}:raise ValueError('Invalid configuration kind')
    config=Path('/etc/jslab')/(kind+'.env')
    if not config.exists() and kind=='migrate':config=config.with_name('api.env')
    for line in config.read_text().splitlines():
        if line and not line.startswith('#'):
            key, value = line.split('=', 1)
            values[key] = shlex.split(value)[0]
    return values

def path(sha, kind):
    if not re.fullmatch('[0-9a-f]{40}', sha): raise ValueError('Invalid release')
    target = APP / kind / sha
    if target.is_symlink() or target.resolve(strict=True).parent != APP / kind:
        raise ValueError('Unsafe path')
    return target

def link(target, name):
    temp = APP / (name + '.next')
    temp.unlink(missing_ok=True)
    temp.symlink_to(target)
    temp.replace(APP / name)

def health():
    for attempt in range(30):
        try:
            for url in ['http://127.0.0.1:3020/api/health', 'http://127.0.0.1:3020/']:
                with urlopen(url, timeout=10) as response: assert response.status == 200
            request = Request('http://127.0.0.1:8092/execute',
                data=json.dumps({'code':'function solve(){return 42}', 'language':'javascript', 'inputs':[[]]}).encode(),
                headers={'Content-Type':'application/json','Authorization':'Bearer '+environment()['RUNNER_TOKEN']})
            with urlopen(request, timeout=20) as response:
                assert json.load(response) == {'ok': True, 'outputs':[42]}
            print('PASS JSlab frontend, API and isolated runner')
            return
        except (OSError, AssertionError, ValueError):
            if attempt == 29: raise RuntimeError('JSlab health check failed') from None
            time.sleep(2)

def activate(sha):
    release, runtime = path(sha,'releases'), path(sha,'runtime')
    if not (runtime/'ready').is_file(): raise ValueError('Incomplete runtime')
    old = (APP/'current').resolve() if (APP/'current').exists() else None
    old_runtime = (APP/'current-runtime').resolve() if (APP/'current-runtime').exists() else None
    link(release,'current'); link(runtime,'current-runtime')
    try:
        subprocess.run(['systemctl','restart',*SERVICES],check=True)
        health()
    except Exception:
        if old and old_runtime:
            link(old,'current'); link(old_runtime,'current-runtime')
            subprocess.run(['systemctl','restart',*SERVICES],check=True)
        else: subprocess.run(['systemctl','stop',*SERVICES],check=True)
        raise
    if old and old != release: link(old,'previous')
    subprocess.run(['systemctl','enable',*SERVICES],check=True)

def backup():
    root=Path('/var/backups/jslab');root.mkdir(mode=0o700,exist_ok=True)
    target=root/('database-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.sql.gz')
    temporary=target.with_suffix('.gz.tmp')
    with temporary.open('xb') as raw:
        with gzip.GzipFile(fileobj=raw,mode='wb') as dest:
            process=subprocess.Popen(['/usr/lib/postgresql/18/bin/pg_dump','-p','5432','-U','postgres','-d','jslab','--no-owner','--no-acl'],user='postgres',group='postgres',extra_groups=[],stdout=subprocess.PIPE)
            shutil.copyfileobj(process.stdout,dest)
            if process.wait(): raise RuntimeError('Backup failed')
    with gzip.open(temporary,'rb') as source:
        while source.read(1024*1024): pass
    os.replace(temporary,target)
    print('Verified compressed JSlab database backup')

if __name__=='__main__':
    os.umask(0o077)
    args=sys.argv[1:]
    if args==['health']:health()
    elif args==['backup']:backup()
    elif len(args)==2 and args[0]=='activate':activate(args[1])
    elif len(args)==2 and args[0]=='migrate':
        release=path(args[1],'releases')
        subprocess.run(['/opt/jslab/node/bin/node',str(release/'backend/node_modules/prisma/build/index.js'),'migrate','deploy'],cwd=release/'backend',env=environment('migrate'),user='jslab-api',group='jslab-api',extra_groups=[],check=True)
    else:raise ValueError('Unknown operation')
