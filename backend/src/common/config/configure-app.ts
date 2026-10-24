import {
  INestApplication,
  ValidationPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { HttpExceptionFilter } from '../errors/http-exception.filter';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const express = app.getHttpAdapter().getInstance() as {
    disable: (key: string) => void;
    set: (key: string, value: unknown) => void;
  };
  express.disable('x-powered-by');
  express.set('trust proxy', config.get<number>('TRUST_PROXY_HOPS', 0));
  app.setGlobalPrefix('api');
  app.use(
    helmet(),
    json({ limit: '64kb' }),
    urlencoded({ extended: false, limit: '16kb', parameterLimit: 20 }),
    cookieParser(),
  );
  app.use(
    (
      req: import('express').Request,
      res: import('express').Response,
      next: import('express').NextFunction,
    ) => {
      res.setHeader('Cache-Control', 'private, no-store');
      // Exact Origin + non-simple custom header; no CORS/preflight permissions.
      if (
        !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
        (req.get('origin') !== config.get<string>('ALLOWED_ORIGIN') ||
          req.get('x-lab-request') !== '1')
      )
        return next(new ForbiddenException('Недопустимый источник запроса.'));
      next();
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
}
