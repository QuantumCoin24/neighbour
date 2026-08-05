import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, type Observable, tap, throwError } from 'rxjs';

import { getRequestContext } from '../context/request-context';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = performance.now();

    const writeLog = (level: 'log' | 'error', caughtError?: unknown): void => {
      const requestContext = getRequestContext();

      const payload = {
        timestamp: new Date().toISOString(),
        requestId: requestContext?.requestId ?? response.getHeader('X-Request-ID') ?? null,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        ip: request.ip,
        userAgent: request.get('user-agent') ?? null,
        userId: requestContext?.userId ?? null,
        ...(caughtError
          ? {
              error:
                caughtError instanceof Error
                  ? {
                      name: caughtError.name,
                      message: caughtError.message,
                    }
                  : String(caughtError),
            }
          : {}),
      };

      this.logger[level](JSON.stringify(payload));
    };

    return next.handle().pipe(
      tap(() => {
        writeLog('log');
      }),
      catchError((caughtError: unknown) => {
        writeLog('error', caughtError);

        return throwError(() => caughtError);
      }),
    );
  }
}
