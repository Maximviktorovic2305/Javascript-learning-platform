export function validateEnvironment(env: Record<string, unknown>) {
  const readString = (key: string, fallback = '') => {
    const value = env[key] ?? fallback;
    if (typeof value !== 'string') throw new Error(`Invalid ${key}`);
    return value;
  };
  const port = Number(env.PORT ?? 8020);
  const hops = Number(env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Invalid PORT');
  if (!Number.isInteger(hops) || hops < 0 || hops > 5)
    throw new Error('Invalid TRUST_PROXY_HOPS');
  const databaseUrl = readString('DATABASE_URL');
  if (!/^postgres(ql)?:\/\//.test(databaseUrl))
    throw new Error('DATABASE_URL must be PostgreSQL');
  const origin = readString('ALLOWED_ORIGIN', 'http://127.0.0.1:3020');
  const parsed = new URL(origin);
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.origin !== origin
  )
    throw new Error('ALLOWED_ORIGIN must be an exact origin');
  const secure = readString('COOKIE_SECURE', 'false');
  if (!['true', 'false'].includes(secure))
    throw new Error('Invalid COOKIE_SECURE');
  if (
    env.NODE_ENV === 'production' &&
    (secure !== 'true' || parsed.protocol !== 'https:')
  )
    throw new Error('Production requires HTTPS and secure cookies');
  const runner = readString('EXECUTION_RUNNER', 'disabled');
  if (!['disabled', 'remote'].includes(runner))
    throw new Error('Invalid EXECUTION_RUNNER');
  const runnerUrl = readString('RUNNER_URL', 'http://127.0.0.1:8092');
  if (!['http:', 'https:'].includes(new URL(runnerUrl).protocol))
    throw new Error('Invalid RUNNER_URL');
  const runnerToken = readString('RUNNER_TOKEN');
  if (runner === 'remote' && runnerToken.length < 32)
    throw new Error('RUNNER_TOKEN requires 32 characters');
  return {
    ...env,
    PORT: port,
    TRUST_PROXY_HOPS: hops,
    DATABASE_URL: databaseUrl,
    ALLOWED_ORIGIN: origin,
    COOKIE_SECURE: secure === 'true',
    EXECUTION_RUNNER: runner,
    RUNNER_URL: runnerUrl,
    RUNNER_TOKEN: runnerToken,
  };
}
