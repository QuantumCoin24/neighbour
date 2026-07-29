import { Injectable } from '@nestjs/common';

import type { PostEntity } from './post.entity';

import { PostRepository } from './post.repository';

@Injectable()
export class PostService {
  constructor(private readonly repository: PostRepository) {}

  create(post: PostEntity): Promise<PostEntity> {
    return this.repository.save(post);
  }

  findCommunityPosts(communityId: string): Promise<PostEntity[]> {
    return this.repository.findByCommunity(communityId);
  }

  findUserPosts(userId: string): Promise<PostEntity[]> {
    return this.repository.findByUser(userId);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
