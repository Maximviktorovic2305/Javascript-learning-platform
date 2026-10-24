import { spawn } from 'node:child_process';
const children = ['backend', 'frontend'].map((cwd) => spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], { cwd, stdio: 'inherit', shell: process.platform === 'win32' }));
for (const child of children) child.on('exit', (code) => { if (code) { for (const sibling of children) sibling.kill(); process.exitCode = code; } });
process.on('SIGINT', () => { for (const child of children) child.kill(); });
