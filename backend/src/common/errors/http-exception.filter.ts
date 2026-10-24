import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const parserType =
      typeof exception === 'object' && exception !== null && 'type' in exception
        ? exception.type
        : null;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : parserType === 'entity.too.large'
          ? 413
          : parserType === 'entity.parse.failed'
            ? 400
            : 500;
    if (status >= 500)
      this.logger.error(
        'Request failed',
        exception instanceof Error ? exception.name : 'UnknownError',
      );
    const message =
      exception instanceof HttpException && status < 500
        ? exception.getResponse()
        : {
            message:
              status === 413
                ? 'Слишком большой запрос.'
                : status === 400
                  ? 'Некорректный JSON.'
                  : 'Сервис временно недоступен. Попробуйте позже.',
          };
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json(typeof message === 'string' ? { message } : message);
  }
}
