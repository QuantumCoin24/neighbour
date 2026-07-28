export interface Environment {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  appVersion: string;
}

export const environment = (): Environment => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  appVersion: process.env.APP_VERSION ?? '1.0.0-alpha.3',
});
