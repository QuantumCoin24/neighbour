#!/usr/bin/env bash
set -euo pipefail

echo "Building Neighbour™ Build 0002 — NestJS API foundation..."

if [[ ! -f "package.json" || ! -f "pnpm-workspace.yaml" ]]; then
  echo "Error: run this script from the Neighbour repository root."
  exit 1
fi

mkdir -p \
  services/api/src/common/filters \
  services/api/src/config \
  services/api/src/health \
  services/api/test \
  docs/architecture

rm -f services/api/.gitkeep

cat > services/api/package.json <<'EOF'
{
  "name": "@neighbour/api",
  "version": "1.0.0-alpha.2",
  "private": true,
  "description": "Neighbour™ shared platform API.",
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "clean": "rm -rf dist .turbo",
    "dev": "nest start --watch",
    "lint": "tsc --noEmit",
    "start": "node dist/main.js",
    "start:prod": "node dist/main.js",
    "test": "node --test --import tsx \"test/**/*.test.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "joi": "^18.0.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/node": "^24.0.0",
    "@types/supertest": "^6.0.3",
    "supertest": "^7.1.4",
    "tsx": "^4.20.0",
    "typescript": "^5.9.0"
  }
}
EOF

cat > services/api/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "declaration": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "incremental": true,
    "noEmit": false,
    "outDir": "./dist",
    "removeComments": true,
    "sourceMap": true,
    "strictPropertyInitialization": false,
    "target": "ES2023"
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > services/api/tsconfig.build.json <<'EOF'
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts", "**/*.test.ts"]
}
EOF

cat > services/api/nest-cli.json <<'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "tsConfigPath": "tsconfig.build.json"
  }
}
EOF

cat > services/api/src/config/environment.ts <<'EOF'
export type Environment = 'development' | 'test' | 'production';

export interface ApplicationConfig {
  corsOrigins: string[];
  environment: Environment;
  host: string;
  port: number;
}

export const applicationConfig = (): { app: ApplicationConfig } => ({
  app: {
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    environment: (process.env.NODE_ENV ?? 'development') as Environment,
    host: process.env.API_HOST ?? '0.0.0.0',
    port: Number.parseInt(process.env.API_PORT ?? '4000', 10),
  },
});
EOF

cat > services/api/src/config/environment.validation.ts <<'EOF'
import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  API_HOST: Joi.string().hostname().default('0.0.0.0'),
  API_PORT: Joi.number().port().default(4000),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
});
EOF

cat > services/api/src/health/health.service.ts <<'EOF'
import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  service: 'neighbour-api';
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      service: 'neighbour-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.0.0-alpha.2',
    };
  }
}
EOF

cat > services/api/src/health/health.controller.ts <<'EOF'
import { Controller, Get } from '@nestjs/common';

import { HealthResponse, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
EOF

cat > services/api/src/health/health.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
EOF

cat > services/api/src/common/filters/http-exception.filter.ts <<'EOF'
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const message = this.resolveMessage(exceptionResponse, exception);
    const code =
      statusCode === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'INTERNAL_SERVER_ERROR'
        : 'REQUEST_FAILED';

    const body: ErrorResponse = {
      error: {
        code,
        message,
        ...(exceptionResponse !== undefined
          ? { details: exceptionResponse }
          : {}),
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
EOF

cat > services/api/src/app.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { applicationConfig } from './config/environment';
import { environmentValidationSchema } from './config/environment.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      expandVariables: true,
      isGlobal: true,
      load: [applicationConfig],
      validationSchema: environmentValidationSchema,
    }),
    HealthModule,
  ],
})
export class AppModule {}
EOF

cat > services/api/src/main.ts <<'EOF'
import 'reflect-metadata';

import {
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import type { ApplicationConfig } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const config = configService.getOrThrow<ApplicationConfig>('app');

  app.enableCors({
    credentials: true,
    origin: config.corsOrigins,
  });

  app.enableShutdownHooks();
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });
  app.setGlobalPrefix('api');

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    }),
  );

  await app.listen(config.port, config.host);

  Logger.log(
    `Neighbour API listening at http://${config.host}:${config.port}/api/v1`,
    'Bootstrap',
  );
}

void bootstrap();
EOF

cat > services/api/test/health.service.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HealthService } from '../src/health/health.service';

describe('HealthService', () => {
  it('returns the platform health payload', () => {
    const result = new HealthService().getHealth();

    assert.equal(result.service, 'neighbour-api');
    assert.equal(result.status, 'ok');
    assert.equal(result.version, '1.0.0-alpha.2');
    assert.equal(typeof result.timestamp, 'string');
    assert.equal(typeof result.uptimeSeconds, 'number');
  });
});
EOF

cat > services/api/test/health.e2e.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Health endpoint', () => {
  let app: INestApplication;

  before(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      defaultVersion: '1',
      type: VersioningType.URI,
    });

    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    assert.equal(response.body.service, 'neighbour-api');
    assert.equal(response.body.status, 'ok');
  });
});
EOF

cat > .env.example <<'EOF'
# Neighbour™ local development environment

NODE_ENV=development

API_HOST=0.0.0.0
API_PORT=4000
CORS_ORIGINS=http://localhost:3000

POSTGRES_DB=neighbour
POSTGRES_USER=neighbour
POSTGRES_PASSWORD=neighbour_local_password
POSTGRES_PORT=5432

REDIS_PORT=6379
EOF

cat > docs/architecture/0002-api-foundation.md <<'EOF'
# Architecture Decision 0002 — API Foundation

## Status

Accepted.

## Context

Neighbour™ requires one shared backend serving the iPhone application and all web
experiences. The first backend increment must establish predictable configuration,
request validation, versioning, health reporting, error handling, testing and
Turborepo integration before domain modules are introduced.

## Decision

The shared API is implemented as a NestJS service under `services/api`.

The service provides:

- environment validation at startup;
- URI-based API versioning;
- the global `/api` prefix;
- strict DTO validation;
- centralised HTTP exception formatting;
- controlled CORS origins;
- graceful shutdown hooks;
- unit and end-to-end health checks;
- the versioned `GET /api/v1/health` endpoint.

## Consequences

All future API modules must:

1. live beneath `services/api/src`;
2. use versioned routes;
3. validate external input through DTOs;
4. return errors through the global exception boundary;
5. include automated tests;
6. pass the repository-wide `pnpm check` command.
EOF

echo "Installing API dependencies..."
pnpm install

echo "Formatting repository..."
pnpm format

echo "Running repository checks..."
pnpm check

echo
echo "Build 0002 complete."
echo
echo "Start the API with:"
echo "  pnpm --filter @neighbour/api dev"
echo
echo "Then test:"
echo "  curl http://localhost:4000/api/v1/health"
echo
echo "When confirmed:"
echo "  git add ."
echo '  git commit -m "build: establish NestJS API foundation"'
echo "  git push"
