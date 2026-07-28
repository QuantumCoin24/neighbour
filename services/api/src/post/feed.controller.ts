import { Controller, Get, Param, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { FeedQueryDto } from './dto/feed-query.dto';
import type { FeedResponse } from './interfaces/post-response.interface';
import { PostService } from './post.service';

@Controller()
export class FeedController {
  constructor(private readonly postService: PostService) {}

  @Get('feed')
  getHomeFeed(@CurrentUser() user: AuthUser, @Query() query: FeedQueryDto): Promise<FeedResponse> {
    return this.postService.getHomeFeed(user.id, query);
  }

  @Get('communities/:slug/feed')
  getCommunityFeed(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponse> {
    return this.postService.getCommunityFeed(user.id, slug, query);
  }

  @Get('profiles/:username/posts')
  getProfilePosts(
    @CurrentUser() user: AuthUser,
    @Param('username') username: string,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponse> {
    return this.postService.getProfilePosts(user.id, username, query);
  }
}
