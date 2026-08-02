import { Injectable } from '@nestjs/common';

import { PostService } from '../post/post.service';
import { EventService } from '../community/event/event.service';
import type { FeedQueryDto } from '../post/dto/feed-query.dto';

import type { ActivityFeedResponse } from './interfaces/activity-response.interface';

@Injectable()
export class ActivityService {

  constructor(
    private readonly postService: PostService,
    private readonly eventService: EventService,
  ) {}

  async getFeed(
    currentUserId: string,
    query: FeedQueryDto,
  ): Promise<ActivityFeedResponse> {

    const [posts, events] = await Promise.all([
      this.postService.getHomeFeed(
        currentUserId,
        query,
      ),
      this.eventService.findForUser(
        currentUserId,
      ),
    ]);


    const items = [
      ...posts.items.map((post) => ({
        id: post.id,
        type: 'POST' as const,
        createdAt: post.createdAt,
        data: post,
      })),

      ...events.map((event) => ({
        id: event.id,
        type: 'EVENT' as const,
        createdAt: event.createdAt,
        data: event,
      })),
    ];


    items.sort(
      (a,b) =>
        new Date(b.createdAt).getTime()
        -
        new Date(a.createdAt).getTime(),
    );


    return {
      items,
    };

  }

}
