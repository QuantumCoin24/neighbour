import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { VibesModule } from '../vibes/vibes.module';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
  imports: [DatabaseModule, VibesModule],
  controllers: [LiveController],
  providers: [LiveService],
  exports: [LiveService],
})
export class LiveModule {}
