import { validateEnvironment } from './environment';
describe('bootstrap configuration', () => {
  const base = { DATABASE_URL: 'postgresql://test@localhost/test' };
  it('accepts local development with no remote executor', () => {
    expect(validateEnvironment(base).EXECUTION_RUNNER).toBe('disabled');
    expect(validateEnvironment(base).HOST).toBe('127.0.0.1');
  });
  it.each([
    { PORT: '-1' },
    { HOST: 'example.test' },
    { TRUST_PROXY_HOPS: 'true' },
    { ALLOWED_ORIGIN: 'https://example.test/path' },
    { COOKIE_SECURE: 'yes' },
    { EXECUTION_RUNNER: 'remote', RUNNER_TOKEN: 'short' },
    { NODE_ENV: 'production', COOKIE_SECURE: 'false' },
  ])('rejects invalid trust boundary configuration %o', (fields) => {
    expect(() => validateEnvironment({ ...base, ...fields })).toThrow();
  });
});
