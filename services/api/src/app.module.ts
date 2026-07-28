import path from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { environment } from './config/environment';
import { environmentValidationSchema } from './config/environment.validation';
import { DatabaseHealthModule } from './database/database-health.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: path.resolve(process.cwd(), '../../.env'),
      load: [environment],
      validationSchema: environmentValidationSchema,
    }),
    AuthModule,
    DatabaseModule,
    HealthModule,
    DatabaseHealthModule,
  ],
})
export class AppModule {}
