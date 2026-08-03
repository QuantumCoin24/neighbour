import { Module } from '@nestjs/common';

import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ModerationStatsService } from './moderation.stats';


@Module({
  controllers:[
    ModerationController,
  ],

  providers:[
    ModerationService,
    ModerationStatsService,
  ],

  exports:[
    ModerationService,
    ModerationStatsService,
  ],
})
export class ModerationModule {}
