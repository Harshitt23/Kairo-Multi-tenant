import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';

/**
 * Catch-all filter that reports unexpected (5xx / non-HTTP) errors to Sentry
 * and returns a clean JSON envelope. Expected HttpExceptions (4xx) pass through
 * with their own status and are not sent to Sentry to avoid noise.
 *
 * Sentry is only initialized when SENTRY_DSN is set (see main.ts), so
 * `captureException` is a no-op in local dev.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isServerError = status >= HttpStatus.INTERNAL_SERVER_ERROR;
    if (isServerError) {
      Sentry.captureException(exception);
      this.logger.error(
        (exception as Error)?.message ?? 'Unknown error',
        (exception as Error)?.stack,
      );
    }

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Internal server error' };

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}
