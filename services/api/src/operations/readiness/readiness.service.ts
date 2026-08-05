import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from '../../config/environment';
import { DatabaseService } from '../../database/database.service';

export interface ReadinessCheck {
  status: 'READY' | 'NOT_READY';
  version: string;
  environment: string;
  checks: {
    database: {
      ready: boolean;
      latencyMs: number | null;
      error?: string;
    };
    configuration: {
      ready: boolean;
    };
    memory: {
      ready: boolean;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
  checkedAt: string;
}

@Injectable()
export class ReadinessService {
  constructor(
    private readonly database: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async check(): Promise<ReadinessCheck> {
    const config = this.configService.getOrThrow<Environment>('app');

    const databaseStartedAt = performance.now();

    let databaseReady = false;
    let databaseError: string | undefined;

    try {
      await this.database.$queryRawUnsafe('SELECT 1');
      databaseReady = true;
    } catch (caughtError) {
      databaseError = caughtError instanceof Error ? caughtError.message : 'Unknown database error';
    }

    const memory = process.memoryUsage();
    const heapUsedMb = Number((memory.heapUsed / 1024 / 1024).toFixed(2));
    const heapTotalMb = Number((memory.heapTotal / 1024 / 1024).toFixed(2));

    const configurationReady = Boolean(
      config.databaseUrl && config.jwtAccessSecret && config.jwtRefreshSecret,
    );

    const ready = databaseReady && configurationReady;

    return {
      status: ready ? 'READY' : 'NOT_READY',
      version: config.appVersion,
      environment: config.nodeEnv,
      checks: {
        database: {
          ready: databaseReady,
          latencyMs: Number((performance.now() - databaseStartedAt).toFixed(2)),
          ...(databaseError
            ? {
                error: databaseError,
              }
            : {}),
        },
        configuration: {
          ready: configurationReady,
        },
        memory: {
          ready: heapUsedMb < 1_024,
          heapUsedMb,
          heapTotalMb,
        },
      },
      checkedAt: new Date().toISOString(),
    };
  }
}
