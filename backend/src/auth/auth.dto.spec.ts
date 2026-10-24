import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './auth.dto';
import { LEGAL_VERSION } from './legal.constants';

describe('Separate registration consent', () => {
  const account = {
    email: 'student@example.test',
    name: 'Student',
    password: 'safe-test-password-42',
  };
  const valid = {
    ...account,
    termsAccepted: true,
    dataConsent: true,
    legalVersion: LEGAL_VERSION,
  };
  it('accepts explicit current consent', async () => {
    expect(await validate(plainToInstance(RegisterDto, valid))).toHaveLength(0);
  });
  it.each([
    account,
    { ...valid, termsAccepted: false },
    { ...valid, dataConsent: 'true' },
    { ...valid, dataConsent: 1 },
    { ...valid, legalVersion: '2026-01-01' },
  ])('rejects missing, coerced or stale acceptance %#', async (body) => {
    expect(
      (await validate(plainToInstance(RegisterDto, body))).length,
    ).toBeGreaterThan(0);
  });
});
