import { Module } from '@nestjs/common';

import { DatabaseHealthController } from './database-health.controller';
import { DatabaseHealthService } from './database-health.service';

@Module({
  controllers: [DatabaseHealthController],
  providers: [DatabaseHealthService],
})
export class DatabaseHealthModule {}
