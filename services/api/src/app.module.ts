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
