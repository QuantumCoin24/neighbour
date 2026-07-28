import { registerAs } from '@nestjs/config';

export interface Environment {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  appVersion: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
}

export const environment = registerAs('app', (): Environment => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  appVersion: process.env.APP_VERSION ?? '1.0.0-alpha.4',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtAccessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  jwtRefreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000),
}));
