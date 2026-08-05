import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { postStatuses, postVisibilities } from '../src/post/dto/create-post.dto';
import type { FeedResponse, PostResponse } from '../src/post/interfaces/post-response.interface';

describe('post contracts', () => {
  it('defines draft and published states', () => {
    assert.deepEqual(postStatuses, ['DRAFT', 'PUBLISHED']);
  });

  it('defines supported visibility states', () => {
    assert.deepEqual(postVisibilities, ['PUBLIC', 'CONNECTIONS', 'COMMUNITY', 'PRIVATE']);
  });

  it('supports a privacy-safe post response', () => {
    const post: PostResponse = {
      type: 'STANDARD',
      isPinned: false,
      metadata: null,
      id: 'post-id',
      title: 'Welcome',
      content: 'Hello, neighbours.',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      author: {
        id: 'author-id',
        displayName: 'Neighbour Member',
        username: 'neighbour-member',
        avatarUrl: null,
        localArea: null,
      },
      community: null,
      neighbourhood: null,
      engagement: {
        commentCount: 0,
        reactionCounts: [
          {
            type: 'LIKE',
            count: 0,
          },
          {
            type: 'LOVE',
            count: 0,
          },
          {
            type: 'SUPPORT',
            count: 0,
          },
          {
            type: 'CELEBRATE',
            count: 0,
          },
          {
            type: 'INSIGHTFUL',
            count: 0,
          },
        ],
        reactionTotal: 0,
        viewerReaction: null,
      },
      publishedAt: new Date('2026-07-28T00:00:00.000Z'),
      editedAt: null,
      createdAt: new Date('2026-07-28T00:00:00.000Z'),
      updatedAt: new Date('2026-07-28T00:00:00.000Z'),
    };

    const feed: FeedResponse = {
      items: [post],
      nextCursor: null,
    };

    assert.equal(feed.items[0]?.content, 'Hello, neighbours.');
    assert.equal(feed.items[0]?.author.localArea, null);
    assert.equal(feed.items[0]?.neighbourhood, null);
    assert.equal(feed.items[0]?.engagement.commentCount, 0);
    assert.equal(feed.items[0]?.engagement.reactionTotal, 0);
  });
});
