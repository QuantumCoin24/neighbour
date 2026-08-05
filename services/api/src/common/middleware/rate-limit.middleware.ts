import type { NextFunction, Request, Response } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitPolicy {
  limit: number;
  windowMs: number;
  name: string;
}

const records = new Map<string, RateLimitRecord>();

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];

  const fallback = request.ip?.trim() || request.socket.remoteAddress?.trim() || 'unknown-client';

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || fallback;
  }

  if (Array.isArray(forwarded)) {
    return forwarded[0]?.trim() || fallback;
  }

  return fallback;
}

function resolvePolicy(request: Request): RateLimitPolicy {
  const path = request.path.toLowerCase();

  if (request.method === 'POST' && path.endsWith('/auth/login')) {
    return {
      limit: 5,
      windowMs: 60_000,
      name: 'authentication-login',
    };
  }

  if (request.method === 'POST' && path.endsWith('/auth/register')) {
    return {
      limit: 3,
      windowMs: 3_600_000,
      name: 'authentication-register',
    };
  }

  if (path.includes('/search')) {
    return {
      limit: 120,
      windowMs: 60_000,
      name: 'search',
    };
  }

  if (request.method === 'POST' && path.includes('/messages')) {
    return {
      limit: 60,
      windowMs: 60_000,
      name: 'messaging',
    };
  }

  if (request.method === 'POST' && path.includes('/businesses')) {
    return {
      limit: 20,
      windowMs: 3_600_000,
      name: 'marketplace-write',
    };
  }

  return {
    limit: positiveInteger(process.env.RATE_LIMIT_MAX, 300),
    windowMs: positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    name: 'platform-default',
  };
}

function removeExpiredRecords(now: number): void {
  if (records.size < 5_000) {
    return;
  }

  for (const [key, record] of records) {
    if (record.resetAt <= now) {
      records.delete(key);
    }
  }
}

export function rateLimitMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const now = Date.now();

  removeExpiredRecords(now);

  const policy = resolvePolicy(request);
  const clientIdentifier = getClientIdentifier(request);
  const key = `${policy.name}:${clientIdentifier}`;

  const existing = records.get(key);

  const record =
    !existing || existing.resetAt <= now
      ? {
          count: 0,
          resetAt: now + policy.windowMs,
        }
      : existing;

  record.count += 1;
  records.set(key, record);

  response.setHeader('RateLimit-Limit', policy.limit);
  response.setHeader('RateLimit-Remaining', Math.max(0, policy.limit - record.count));
  response.setHeader('RateLimit-Reset', Math.ceil(record.resetAt / 1_000));
  response.setHeader('RateLimit-Policy', policy.name);

  if (record.count > policy.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1_000));

    response.setHeader('Retry-After', retryAfterSeconds);

    response.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests. Please try again later.',
      retryAfterSeconds,
    });

    return;
  }

  next();
}
