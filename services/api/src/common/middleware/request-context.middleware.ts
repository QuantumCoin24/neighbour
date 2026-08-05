import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { runWithRequestContext } from '../context/request-context';

const REQUEST_ID_HEADER = 'x-request-id';

export function requestContextMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const suppliedRequestId = request.header(REQUEST_ID_HEADER)?.trim();

  const requestId =
    suppliedRequestId && /^[a-zA-Z0-9._:-]{8,128}$/.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();

  response.setHeader('X-Request-ID', requestId);

  runWithRequestContext(
    {
      requestId,
      method: request.method,
      path: request.originalUrl,
      startedAt: performance.now(),
    },
    next,
  );
}
