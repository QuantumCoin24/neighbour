import 'reflect-metadata';

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { rateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { requestContextMiddleware } from './common/middleware/request-context.middleware';
import { securityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import type { Environment } from './config/environment';

function getCorsOrigins(): string[] | true {
  const configuredOrigins = process.env.CORS_ORIGINS?.trim();

  if (!configuredOrigins) {
    return process.env.NODE_ENV === 'production' ? [] : true;
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const config = configService.getOrThrow<Environment>('app');
  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin:
      corsOrigins === true
        ? true
        : (
            origin: string | undefined,
            callback: (error: Error | null, allowed?: boolean) => void,
          ) => {
            if (!origin || corsOrigins.includes(origin)) {
              callback(null, true);

              return;
            }

            callback(new Error('Origin is not allowed by CORS.'), false);
          },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.enableShutdownHooks();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  app.use(requestContextMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(rateLimitMiddleware);

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(config.port, '0.0.0.0');

  Logger.log(
    JSON.stringify({
      message: 'Neighbour API started',
      port: config.port,
      version: config.appVersion,
      environment: config.nodeEnv,
      pid: process.pid,
    }),
    'Bootstrap',
  );
}

void bootstrap();
