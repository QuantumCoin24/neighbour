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
