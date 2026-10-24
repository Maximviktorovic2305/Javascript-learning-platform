# JSlab API

NestJS 11, TypeScript, Prisma 7 and PostgreSQL. Initialized through the official Nest CLI. See the root [README](../README.md) for setup and Docker commands.

Feature modules: auth, catalog, learning, profile, projects. Thin controllers delegate to services. Global ValidationPipe validates DTOs. Shared infrastructure lives in src/common.

Public routes: /api/catalog/tracks, /api/catalog/lessons/:id, /api/catalog/exercises, /api/catalog/projects. Private routes require a valid HttpOnly session. State changes require exact ALLOWED_ORIGIN and X-Lab-Request: 1. Nuxt proxies /api.

Set DATABASE_URL in .env, then run npm ci, npm run db:migrate, npm run dev. EXECUTION_RUNNER=disabled leaves theory and quizzes available and returns 503 for code grading. Never replace the isolated grader with host execution or node:vm.

Checks: npm run typecheck, npm run lint, npm test -- --runInBand, npm run build. HTTP tests require a separate script_lab_test database: npm run test:e2e -- --runInBand.
