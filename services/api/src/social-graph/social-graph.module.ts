import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { SocialGraphController } from './social-graph.controller';
import { SocialGraphService } from './social-graph.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SocialGraphController],
  providers: [SocialGraphService],
  exports: [SocialGraphService],
})
export class SocialGraphModule {}
