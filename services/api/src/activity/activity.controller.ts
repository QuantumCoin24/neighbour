import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

import { FeedQueryDto } from '../post/dto/feed-query.dto';

import { ActivityService } from './activity.service';
import type { ActivityFeedResponse } from './interfaces/activity-response.interface';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('feed')
  getFeed(
    @CurrentUser() user: AuthUser,
    @Query() query: FeedQueryDto,
  ): Promise<ActivityFeedResponse> {
    return this.activityService.getFeed(user.id, query);
  }
}
