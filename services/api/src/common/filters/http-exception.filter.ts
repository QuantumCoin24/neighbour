import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  error: {
    code: string;
    details?: unknown;
    message: string;
  };
  path: string;
  statusCode: number;
  timestamp: string;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const message = this.resolveMessage(exceptionResponse, exception);
    const code =
      statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED';

    const body: ErrorResponse = {
      error: {
        code,
        message,
        ...(exceptionResponse !== undefined ? { details: exceptionResponse } : {}),
      },
      path: request.originalUrl,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolveMessage(
    exceptionResponse: string | object | undefined,
    exception: unknown,
  ): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      'message' in exceptionResponse &&
      typeof exceptionResponse.message === 'string'
    ) {
      return exceptionResponse.message;
    }

    if (exception instanceof Error && exception.message) {
      return exception.message;
    }

    return 'An unexpected error occurred.';
  }
}
