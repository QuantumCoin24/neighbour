#!/bin/bash

set -e

echo "🚀 BUILD 0027 — Community Feed Engine"

cd services/api

mkdir -p src/community/post
mkdir -p src/community/reaction
mkdir -p src/community/feed
mkdir -p src/community/events


# ==============================
# POST ENTITY
# ==============================

cat > src/community/post/post.entity.ts <<'TS'
export interface PostEntity {
  id: string;
  communityId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
TS


# ==============================
# POST REPOSITORY
# ==============================

cat > src/community/post/post.repository.ts <<'TS'
import type { PostEntity } from './post.entity';

export abstract class PostRepository {

  abstract save(
    post: PostEntity,
  ): Promise<PostEntity>;

  abstract findById(
    id: string,
  ): Promise<PostEntity | undefined>;

  abstract findByCommunity(
    communityId: string,
  ): Promise<PostEntity[]>;

  abstract findByUser(
    userId: string,
  ): Promise<PostEntity[]>;

  abstract remove(
    id: string,
  ): Promise<void>;

}
TS


# ==============================
# POST SERVICE
# ==============================

cat > src/community/post/post.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { PostEntity } from './post.entity';

import { PostRepository } from './post.repository';


@Injectable()
export class PostService {

  constructor(
    private readonly repository: PostRepository,
  ) {}


  create(
    post: PostEntity,
  ): Promise<PostEntity> {
    return this.repository.save(post);
  }


  findCommunityPosts(
    communityId: string,
  ): Promise<PostEntity[]> {
    return this.repository.findByCommunity(
      communityId,
    );
  }


  findUserPosts(
    userId: string,
  ): Promise<PostEntity[]> {
    return this.repository.findByUser(userId);
  }


  remove(
    id: string,
  ): Promise<void> {
    return this.repository.remove(id);
  }

}
TS


# ==============================
# REACTION
# ==============================

cat > src/community/reaction/reaction.entity.ts <<'TS'
export interface ReactionEntity {
  id: string;
  postId: string;
  userId: string;
  type: string;
  createdAt: Date;
}
TS


cat > src/community/reaction/reaction.repository.ts <<'TS'
import type { ReactionEntity } from './reaction.entity';

export abstract class ReactionRepository {

  abstract save(
    reaction: ReactionEntity,
  ): Promise<ReactionEntity>;

  abstract remove(
    userId: string,
    postId: string,
  ): Promise<void>;

  abstract findByPost(
    postId: string,
  ): Promise<ReactionEntity[]>;

}
TS


cat > src/community/reaction/reaction.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ReactionEntity } from './reaction.entity';

import { ReactionRepository } from './reaction.repository';


@Injectable()
export class ReactionService {

  constructor(
    private readonly repository: ReactionRepository,
  ) {}


  add(
    reaction: ReactionEntity,
  ): Promise<ReactionEntity> {
    return this.repository.save(reaction);
  }


  remove(
    userId: string,
    postId: string,
  ): Promise<void> {
    return this.repository.remove(
      userId,
      postId,
    );
  }


  list(
    postId: string,
  ): Promise<ReactionEntity[]> {
    return this.repository.findByPost(postId);
  }

}
TS


# ==============================
# FEED SERVICE
# ==============================

cat > src/community/feed/feed.response.ts <<'TS'
import type { PostEntity } from '../post/post.entity';

export interface FeedResponse {
  posts: PostEntity[];
}
TS


cat > src/community/feed/feed.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import { PostService } from '../post/post.service';

@Injectable()
export class FeedService {

  constructor(
    private readonly posts: PostService,
  ) {}


  async getCommunityFeed(
    communityId: string,
  ) {

    const posts =
      await this.posts.findCommunityPosts(
        communityId,
      );

    return {
      posts,
    };
  }

}
TS


# ==============================
# EVENTS
# ==============================

cat > src/community/events/community-feed-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

export type CommunityFeedEvent =
  | {
      type: 'post.created';
      postId: string;
    }
  | {
      type: 'post.reacted';
      postId: string;
    };


@Injectable()
export class CommunityFeedEventBusService {

  private listeners:
    ((event: CommunityFeedEvent) => void)[] = [];


  subscribe(
    listener: (event: CommunityFeedEvent) => void,
  ) {
    this.listeners.push(listener);
  }


  publish(
    event: CommunityFeedEvent,
  ) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

}
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0027 COMPLETE"

