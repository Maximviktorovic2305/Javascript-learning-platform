#!/usr/bin/python3 -I
"""Root-owned, bounded sandbox entry point; accepts no paths or shell commands."""
import json
import os
import re
import sys


def command(args):
    if len(args) < 2 or not re.fullmatch(r'[0-9a-f]{32}', args[1]):
        raise ValueError('Invalid job identifier')
    unit = 'jslab-jail-' + args[1] + '.service'
    if args[0] == 'stop' and len(args) == 2:
        return ['/usr/bin/systemctl', 'stop', unit]
    if args[0] != 'start' or len(args) != 3 or len(args[2].encode()) > 64000:
        raise ValueError('Invalid operation')
    job = json.loads(args[2])
    if not isinstance(job, dict) or set(job) != {'code', 'language', 'inputs'}:
        raise ValueError('Invalid job')
    if not isinstance(job['code'], str) or not 0 < len(job['code']) <= 20000:
        raise ValueError('Invalid code')
    if job['language'] not in ('javascript', 'typescript'):
        raise ValueError('Invalid language')
    if not isinstance(job['inputs'], list) or not 1 <= len(job['inputs']) <= 10:
        raise ValueError('Invalid cases')
    if any(not isinstance(row, list) or len(row) > 10 for row in job['inputs']):
        raise ValueError('Invalid arguments')
    return [
        '/usr/bin/systemd-run', '--quiet', '--pipe', '--wait', '--collect',
        '--service-type=exec', '--unit=' + unit,
        '--property=MemoryMax=256M', '--property=MemorySwapMax=0',
        '--property=TasksMax=64', '--property=CPUQuota=75%',
        '--property=RuntimeMaxSec=17', '--property=TimeoutStopSec=2',
        '--property=KillMode=control-group',
        '/usr/local/bin/nsjail', '--config', '/etc/jslab/jail.cfg', '--',
        '/opt/jslab/node/bin/node', '--max-old-space-size=160',
        '--v8-pool-size=1', '/opt/app/execute.cjs', args[2],
    ]


if __name__ == '__main__':
    try:
        argv = command(sys.argv[1:])
    except (ValueError, TypeError, KeyError):
        sys.exit('Invalid sandbox request')
    os.execve(argv[0], argv, {'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'LANG': 'C.UTF-8'})
