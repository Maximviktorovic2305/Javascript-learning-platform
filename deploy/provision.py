#!/usr/bin/python3 -I
"""One-time root provisioning, followed by bounded jslab-admin operations."""
import os
import pathlib
import pwd
import re
import secrets
import shutil
import subprocess
import sys

os.umask(0o077)
sha=sys.argv[1]
assert re.fullmatch('[0-9a-f]{40}',sha)
app=pathlib.Path('/home/max/jslab')
release=app/'releases'/sha
assert release.resolve().parent==app/'releases'
assert (app/'runtime'/sha/'ready').is_file()
assert pathlib.Path('/usr/local/bin/nsjail').is_file()
def run(args,**kw):return subprocess.run(args,check=True,**kw)
def write(path,text,mode=0o644):
    p=pathlib.Path(path);p.write_text(text);p.chmod(mode)
for name in ['jslab-api','jslab-web','jslab-runner']:
    try:pwd.getpwnam(name)
    except KeyError:run(['useradd','--system','--no-create-home','--shell','/usr/sbin/nologin',name])
etc=pathlib.Path('/etc/jslab');etc.mkdir(mode=0o700,exist_ok=True)
opt=pathlib.Path('/opt/jslab');(opt/'node/bin').mkdir(parents=True,exist_ok=True)
for p in [opt,opt/'node',opt/'node/bin']:p.chmod(0o755)
shutil.copy2('/home/max/.nvm/versions/node/v24.22.1/bin/node',opt/'node/bin/node')
(opt/'node/bin/node').chmod(0o755)
if not (etc/'api.env').exists():
    password=secrets.token_hex(32);token=secrets.token_hex(48)
    sql="CREATE ROLE jslab LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '"+password+"'; CREATE DATABASE jslab OWNER jslab;"
    # Separate statements: CREATE DATABASE cannot run inside a transaction block.
    for statement in sql.split(';'):
        if statement.strip():run(['runuser','-u','postgres','--','psql','-X','-q','-p','5432','-v','ON_ERROR_STOP=1'],input=statement+';',text=True,stdout=subprocess.DEVNULL)
    write(etc/'api.env',f'NODE_ENV=production\nHOST=127.0.0.1\nPORT=8020\nDATABASE_URL=postgresql://jslab:{password}@127.0.0.1:5432/jslab\nALLOWED_ORIGIN=https://js-lab.site\nCOOKIE_SECURE=true\nTRUST_PROXY_HOPS=1\nEXECUTION_RUNNER=remote\nRUNNER_URL=http://127.0.0.1:8092\nRUNNER_TOKEN={token}\n',0o600)
    write(etc/'runner.env',f'NODE_ENV=production\nSANDBOX_ENGINE=nsjail\nRUNNER_HOST=127.0.0.1\nRUNNER_TOKEN={token}\n',0o600)
source=release/'runner/sandbox'
for p in source.rglob('*'):
    if p.is_symlink():assert p.resolve().is_relative_to(source.resolve()),'Sandbox dependency symlink escapes source'
if not (opt/'sandbox').exists():shutil.copytree(source,opt/'sandbox',symlinks=True)
shutil.copy2(source/'execute.cjs',opt/'sandbox/execute.cjs')
for p in (opt/'sandbox').rglob('*'):
    if not p.is_symlink():p.chmod((p.stat().st_mode&0o777)|0o444|(0o111 if p.is_dir() else 0))
shutil.copy2(release/'deploy/jail.cfg',etc/'jail.cfg')
for source,dest in [('jail-helper.py','jslab-jail'),('admin.py','jslab-admin')]:
    shutil.copy2(release/'deploy'/source,'/usr/local/sbin/'+dest)
    pathlib.Path('/usr/local/sbin/'+dest).chmod(0o755)
write('/etc/sudoers.d/jslab','max ALL=(root) NOPASSWD: /usr/local/sbin/jslab-admin\njslab-runner ALL=(root) NOPASSWD: /usr/local/sbin/jslab-jail\n',0o440)
run(['visudo','-cf','/etc/sudoers.d/jslab'],stdout=subprocess.DEVNULL)
for name,folder,env,command,memory in [
    ('api','api','EnvironmentFile=/etc/jslab/api.env','dist/main.js','384M'),
    ('web','web','Environment=NODE_ENV=production HOST=127.0.0.1 PORT=3020 NUXT_API_BASE=http://127.0.0.1:8020','server/index.mjs','384M'),
    ('runner','runner','EnvironmentFile=/etc/jslab/runner.env','server.mjs','128M')]:
    root=app/'current-runtime'/folder
    broker=name=='runner'
    protections=('NoNewPrivileges=no\nCapabilityBoundingSet=CAP_SETUID CAP_SETGID CAP_AUDIT_WRITE\n' if broker else 'NoNewPrivileges=yes\nCapabilityBoundingSet=\nRestrictNamespaces=yes\nRestrictSUIDSGID=yes\nRestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX\nPrivateDevices=yes\n')
    unit=f'''[Unit]
Description=JSlab {name}
After=network.target postgresql.service
[Service]
User=jslab-{name}
Group=jslab-{name}
WorkingDirectory={root}
{env}
ExecStart=/opt/jslab/node/bin/node {command}
Restart=on-failure
RestartSec=3
MemoryMax={memory}
TasksMax=64
UMask=0077
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=read-only
ProtectProc=invisible
ProcSubset=pid
InaccessiblePaths=/home/max/.ssh /home/max/.config /home/max/.pm2 /home/max/releases /home/max/my-songs-site /home/max/chat-gpt-app /home/max/portfolio /home/max/python-platform /etc/python-platform
IPAddressDeny=any
IPAddressAllow=localhost
{protections}
[Install]
WantedBy=multi-user.target
'''
    write('/etc/systemd/system/jslab-'+name+'.service',unit)
run(['systemctl','daemon-reload'])
run(['/usr/local/sbin/jslab-admin','migrate',sha])
print('JSlab users, private configuration, PostgreSQL 18 database and isolated services provisioned')
