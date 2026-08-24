import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { VibesController } from './vibes.controller';
import { VibesService } from './vibes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VibesController],
  providers: [VibesService],
  exports: [VibesService],
})
export class VibesModule {}
