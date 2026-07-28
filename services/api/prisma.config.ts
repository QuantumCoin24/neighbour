import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, env } from 'prisma/config';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

config({
  path: path.resolve(currentDirectory, '../../.env'),
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
