import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const helper = '/usr/local/sbin/jslab-jail';
export function execute(job, { signal, spawnProcess = spawn, timeoutMs = 18000 } = {}) {
  const id = randomUUID().replaceAll('-', '');
  return new Promise(resolve => {
    let output = '', bytes = 0, done = false;
    const child = spawnProcess('sudo', ['-n', helper, 'start', id, JSON.stringify(job)], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const finish = (result, kill = false) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      if (kill) {
        child.kill();
        const cleanup = spawnProcess('sudo', ['-n', helper, 'stop', id], { stdio: 'ignore', windowsHide: true });
        cleanup.on('error', () => {});
      }
      resolve(result);
    };
    const cancel = () => finish({ ok: false, error: 'Выполнение отменено.' }, true);
    const timer = setTimeout(() => finish({ ok: false, error: 'Превышено время выполнения.' }, true), timeoutMs);
    if (signal?.aborted) return cancel();
    signal?.addEventListener('abort', cancel, { once: true });
    child.stdout.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 32000) return finish({ ok: false, error: 'Превышен лимит вывода.' }, true);
      output += chunk.toString();
    });
    child.stderr.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 32000) finish({ ok: false, error: 'Превышен лимит вывода.' }, true);
    });
    child.on('error', () => finish({ ok: false, error: 'Песочница недоступна.' }, true));
    child.on('close', code => {
      if (code !== 0) return finish({ ok: false, error: 'Ошибка изолированного процесса.' });
      try {
        const result = JSON.parse(output);
        if (!result || typeof result.ok !== 'boolean') throw new Error();
        finish(result);
      } catch { finish({ ok: false, error: 'Некорректный результат программы.' }); }
    });
  });
}
