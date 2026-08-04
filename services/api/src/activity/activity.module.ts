import { Module } from '@nestjs/common';

import { PostModule } from '../post/post.module';
import { CommunityModule } from '../community/community.module';

import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [PostModule, CommunityModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
