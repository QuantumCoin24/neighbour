import { Injectable } from '@nestjs/common';

import { PostService } from '../post/post.service';

@Injectable()
export class FeedService {
  constructor(private readonly posts: PostService) {}

  async getCommunityFeed(communityId: string) {
    const posts = await this.posts.findCommunityPosts(communityId);

    return {
      posts,
    };
  }
}
