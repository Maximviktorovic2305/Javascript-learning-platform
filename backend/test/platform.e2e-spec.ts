import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID, createHash } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/config/configure-app';
import { PrismaService } from '../src/common/database/prisma.service';
import { CatalogService } from '../src/catalog/catalog.service';
import { RunnerService } from '../src/learning/runner.service';
import { SESSION_COOKIE } from '../src/auth/auth.types';
import { LEGAL_VERSION } from '../src/auth/legal.constants';

describe('Script Lab HTTP and PostgreSQL', () => {
  let app: INestApplication, db: PrismaService, catalog: CatalogService;
  const accounts: string[] = [];
  const prefix = randomUUID();
  const password = 'a-strong-test-password-42';
  const origin = 'http://127.0.0.1:3020';
  const headers = { origin: origin, 'x-lab-request': '1' };
  const consent = {
    termsAccepted: true,
    dataConsent: true,
    legalVersion: LEGAL_VERSION,
  };
  let cookie: string, userId: string;
  const runner = { execute: jest.fn() };
  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.endsWith('/script_lab_test'))
      throw new Error('Use a separate script_lab_test database');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RunnerService)
      .useValue(runner)
      .compile();
    app = module.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
    db = app.get(PrismaService);
    catalog = app.get(CatalogService);
  });
  afterAll(async () => {
    if (db)
      await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
    if (app) await app.close();
  });
  it('serves public curriculum without answers, solutions or framework headers', async () => {
    const r = await request(app.getHttpServer())
      .get('/api/catalog/lessons/javascript-values')
      .expect(200);
    expect(r.body.exercise.solution).toBeUndefined();
    expect(r.body.exercise.tests).toBeUndefined();
    expect(r.body.questions[0].answer).toBeUndefined();
    expect(r.headers['x-powered-by']).toBeUndefined();
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['cache-control']).toContain('no-store');
    await request(app.getHttpServer()).get('/api/profile/progress').expect(401);
  });
  it('rejects cross-site changes, absent CSRF header and unknown DTO fields', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set({ ...headers, origin: 'https://evil.test' })
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('origin', origin)
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(headers)
      .send({
        email: `${prefix}-bad@test.invalid`,
        name: 'JS',
        password,
        role: 'admin',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(headers)
      .send({ email: 'broken', name: 'JS', password: 'short' })
      .expect(400);
  });
  it('registers, restores and logs in with a scoped HttpOnly session', async () => {
    const email = `${prefix}-a@test.invalid`;
    accounts.push(email);
    const r = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(headers)
      .send({ email, name: 'Ученик', password, ...consent })
      .expect(201);
    expect(r.body.passwordHash).toBeUndefined();
    expect(r.body.credentialVersion).toBeUndefined();
    expect(r.body.token).toBeUndefined();
    userId = r.body.id;
    expect(r.body.legalVersion).toBeUndefined();
    expect(r.body.dataConsentAt).toBeUndefined();
    const recorded = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(recorded.legalVersion).toBe(LEGAL_VERSION);
    expect(recorded.dataConsentAt).toBeInstanceOf(Date);
    expect(recorded.termsAcceptedAt).toBeInstanceOf(Date);
    cookie = r.headers['set-cookie'][0].split(';')[0];
    expect(r.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(r.headers['set-cookie'][0]).toContain('Path=/api');
    expect(r.headers['set-cookie'][0]).toContain('SameSite=Lax');
    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('cookie', cookie)
      .expect(200);
    expect(me.body.id).toBe(userId);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set(headers)
      .send({ email, password })
      .expect(201);
    expect(login.body.passwordHash).toBeUndefined();
    expect(login.headers['set-cookie'][0]).not.toBe(cookie);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set(headers)
      .send({ email, password: 'wrong-password-here' })
      .expect(401);
  });
  it('runs public server examples with session, CSRF and DTO checks without changing progress', async () => {
    const endpoint = '/api/learning/express-http/examples';
    const exercise = catalog.getLesson('express-http').exercise;
    const body = { code: exercise.starterCode, language: exercise.language };
    const callsBefore = runner.execute.mock.calls.length;
    await request(app.getHttpServer())
      .post(endpoint)
      .set(headers)
      .send(body)
      .expect(401);
    await request(app.getHttpServer())
      .post(endpoint)
      .set('cookie', cookie)
      .set('origin', origin)
      .send(body)
      .expect(403);
    await request(app.getHttpServer())
      .post(endpoint)
      .set('cookie', cookie)
      .set(headers)
      .send({ ...body, inputs: [[]] })
      .expect(400);
    await request(app.getHttpServer())
      .post(endpoint)
      .set('cookie', cookie)
      .set(headers)
      .send({ ...body, code: '' })
      .expect(400);
    expect(runner.execute.mock.calls).toHaveLength(callsBefore);
    const before = await db.attempt.count({ where: { userId } });
    runner.execute.mockResolvedValueOnce({
      ok: true,
      outputs: exercise.tests.slice(0, 2).map((test) => test.expected),
      message: '',
    });
    const response = await request(app.getHttpServer())
      .post(endpoint)
      .set('cookie', cookie)
      .set(headers)
      .send(body)
      .expect(201);
    expect(response.body).toEqual({
      ok: true,
      outputs: exercise.tests.slice(0, 2).map((test) => test.expected),
      message: '',
    });
    expect(runner.execute).toHaveBeenLastCalledWith(body.code, body.language, {
      ...exercise,
      tests: exercise.tests.slice(0, 2),
    });
    expect(await db.attempt.count({ where: { userId } })).toBe(before);
    expect(await db.award.count({ where: { userId } })).toBe(0);
  });
  it('awards XP only once under concurrent requests and grades quizzes server-side', async () => {
    const read = await Promise.all(
      Array.from({ length: 4 }, () =>
        request(app.getHttpServer())
          .post('/api/learning/javascript-values/read')
          .set(headers)
          .set('cookie', cookie)
          .send({})
          .expect(201),
      ),
    );
    expect(read.reduce((n, r) => n + r.body.xp, 0)).toBe(10);
    const answers = catalog
      .getLesson('javascript-values')
      .questions.map((q) => q.answer);
    const failed = await request(app.getHttpServer())
      .post('/api/learning/javascript-values/quiz')
      .set(headers)
      .set('cookie', cookie)
      .send({ answers: answers.map((a) => (a + 1) % 3) })
      .expect(201);
    expect(failed.body).toMatchObject({ passed: false, xp: 0 });
    const partial = await request(app.getHttpServer())
      .get('/api/profile/progress')
      .set('cookie', cookie)
      .expect(200);
    expect(partial.body.completed).toContain('theory:javascript-values');
    expect(partial.body.completed).not.toContain('quiz:javascript-values');
    expect(partial.body.started).toContain('quiz:javascript-values');
    const passed = await request(app.getHttpServer())
      .post('/api/learning/javascript-values/quiz')
      .set(headers)
      .set('cookie', cookie)
      .send({ answers })
      .expect(201);
    expect(passed.body).toMatchObject({ passed: true, xp: 30, score: 100 });
    const repeated = await request(app.getHttpServer())
      .post('/api/learning/javascript-values/quiz')
      .set(headers)
      .set('cookie', cookie)
      .send({ answers })
      .expect(201);
    expect(repeated.body.xp).toBe(0);
    await request(app.getHttpServer())
      .post('/api/learning/javascript-values/quiz')
      .set(headers)
      .set('cookie', cookie)
      .send({ answers: [0] })
      .expect(400);
  });
  it('compares server executor output to hidden answers and rejects client XP', async () => {
    const outputs = catalog
      .getLesson('javascript-values')
      .exercise.tests.map((t) => t.expected);
    runner.execute.mockResolvedValueOnce({
      ok: true,
      outputs: outputs.map(() => 'wrong'),
      message: '',
    });
    const failed = await request(app.getHttpServer())
      .post('/api/learning/javascript-values/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ code: 'function solve(){}', language: 'javascript' })
      .expect(201);
    expect(failed.body).toMatchObject({ passed: false, xp: 0 });
    runner.execute.mockResolvedValue({ ok: true, outputs, message: '' });
    const first = await request(app.getHttpServer())
      .post('/api/learning/javascript-values/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ code: 'function solve(){}', language: 'javascript' })
      .expect(201);
    expect(first.body).toMatchObject({ passed: true, xp: 50 });
    const repeat = await request(app.getHttpServer())
      .post('/api/learning/javascript-values/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ code: 'function solve(){}', language: 'javascript' })
      .expect(201);
    expect(repeat.body.xp).toBe(0);
    await request(app.getHttpServer())
      .post('/api/learning/javascript-values/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ code: 'x', language: 'javascript', xp: 50000 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/learning/javascript-values/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ code: 'x', language: 'typescript' })
      .expect(400);
    const progress = await request(app.getHttpServer())
      .get('/api/profile/progress')
      .set('cookie', cookie)
      .expect(200);
    expect(progress.body.xp).toBe(90);
    expect(progress.body.solved).toBe(1);
    expect(progress.body.completed).toEqual(
      expect.arrayContaining([
        'theory:javascript-values',
        'practice:javascript-values',
        'quiz:javascript-values',
      ]),
    );
    runner.execute.mockResolvedValueOnce({
      ok: false,
      outputs: [],
      message: 'Ошибка выполнения',
    });
    await request(app.getHttpServer())
      .post('/api/learning/javascript-start/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ code: 'function solve(){}', language: 'javascript' })
      .expect(201);
    const unfinished = await request(app.getHttpServer())
      .get('/api/profile/progress')
      .set('cookie', cookie)
      .expect(200);
    expect(unfinished.body.started).toContain('practice:javascript-start');
    expect(unfinished.body.completed).not.toContain(
      'practice:javascript-start',
    );
    expect(unfinished.body.xp).toBe(90);
  });
  it('isolates accounts and validates profile settings and project URLs', async () => {
    const email = `${prefix}-b@test.invalid`;
    accounts.push(email);
    const second = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(headers)
      .send({ email, name: 'Другой', password, ...consent })
      .expect(201);
    const secondCookie = second.headers['set-cookie'][0].split(';')[0];
    const progress = await request(app.getHttpServer())
      .get('/api/profile/progress')
      .set('cookie', secondCookie)
      .expect(200);
    expect(progress.body.xp).toBe(0);
    expect(progress.body.started).toEqual([]);
    expect(progress.body.completed).toEqual([]);
    await request(app.getHttpServer())
      .patch('/api/profile')
      .set(headers)
      .set('cookie', cookie)
      .send({ name: 'Ученик', dailyGoal: 50, timezone: 'Invalid/Timezone' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/profile')
      .set(headers)
      .set('cookie', cookie)
      .send({ name: 'Учусь JS', dailyGoal: 100, timezone: 'Europe/Moscow' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/projects/js-tracker/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ url: 'javascript:alert(1)' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/projects/js-tracker/submit')
      .set(headers)
      .set('cookie', cookie)
      .send({ url: 'https://github.com/example/my-tracker' })
      .expect(201);
    const own = await request(app.getHttpServer())
      .get('/api/projects/submissions')
      .set('cookie', cookie)
      .expect(200);
    expect(own.body).toHaveLength(1);
    const other = await request(app.getHttpServer())
      .get('/api/projects/submissions')
      .set('cookie', secondCookie)
      .expect(200);
    expect(other.body).toHaveLength(0);
  });
  it('invalidates expired and revoked sessions and all sessions after password change', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('cookie', `${SESSION_COOKIE}=broken`)
      .expect(401);
    const expiredToken = 'c'.repeat(64);
    const expiry = await db.session.create({
      data: {
        tokenHash: createHash('sha256').update(expiredToken).digest('hex'),
        userId,
        expiresAt: new Date(0),
      },
    });
    expect(expiry.expiresAt.getTime()).toBe(0);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('cookie', `${SESSION_COOKIE}=${expiredToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/profile/password')
      .set(headers)
      .set('cookie', cookie)
      .send({
        currentPassword: password,
        nextPassword: 'new-strong-password-43',
      })
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('cookie', cookie)
      .expect(401);
    const staleToken = 'd'.repeat(64);
    await db.session.create({
      data: {
        tokenHash: createHash('sha256').update(staleToken).digest('hex'),
        userId,
        credentialVersion: 0,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('cookie', `${SESSION_COOKIE}=${staleToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set(headers)
      .set('cookie', cookie)
      .send({})
      .expect(201);
  });
  it('bounds request size and throttles authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/learning/javascript-values/submit')
      .set(headers)
      .send({ code: 'x'.repeat(70000), language: 'javascript' })
      .expect(413);
    const results = [];
    for (let index = 0; index < 12; index++)
      results.push(
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .set(headers)
          .send({ email: 'invalid', password: 'short' }),
      );
    expect(results.some((r) => r.status === 429)).toBe(true);
    expect(results.find((r) => r.status === 429)?.body.message).toBe(
      'Слишком много запросов. Подождите минуту и попробуйте снова.',
    );
  });
});
