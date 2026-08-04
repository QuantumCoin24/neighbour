'use client';

import { useEffect, useState } from 'react';

import { getCommunityFeed, type Post } from '@neighbour/api-client';

import {
  NeighbourAvatar,
  NeighbourBadge,
  NeighbourCard,
  NeighbourButton,
} from '@neighbour/design-system';

interface Props {
  token: string;
  communitySlug?: string;
}

export default function FeedPreview({
  token,

  communitySlug,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function load() {
      if (!communitySlug) {
        return;
      }

      try {
        const response = await getCommunityFeed(token, communitySlug);

        setPosts(response.items.slice(0, 3));
      } catch {
        setPosts([]);
      }
    }

    load();
  }, [token, communitySlug]);

  return (
    <NeighbourCard
      style={{
        marginTop: '24px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '24px',
        }}
      >
        📰 Community Feed
      </h2>

      <p
        style={{
          color: '#667085',
          marginTop: '8px',
        }}
      >
        Latest conversations from your neighbours.
      </p>

      {posts.length === 0 ? (
        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            background: '#F7F9FC',
            borderRadius: '16px',
          }}
        >
          <p>No community posts yet.</p>

          <p
            style={{
              color: '#667085',
            }}
          >
            Be the first neighbour to share an update.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}

            style={{
              marginTop: '20px',

              padding: '20px',

              background: '#F7F9FC',

              borderRadius: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',

                alignItems: 'center',

                gap: '12px',
              }}
            >
              <NeighbourAvatar name={post.author.displayName} />

              <div>
                <strong>{post.author.displayName}</strong>

                <div>
                  <NeighbourBadge>{post.community?.name ?? 'Neighbour'}</NeighbourBadge>
                </div>
              </div>
            </div>

            <h3
              style={{
                marginTop: '16px',
              }}
            >
              {post.title ?? 'Neighbour Update'}
            </h3>

            <p
              style={{
                color: '#667085',
                lineHeight: 1.6,
              }}
            >
              {post.content}
            </p>
          </div>
        ))
      )}

      <div
        style={{
          marginTop: '20px',
        }}
      >
        <NeighbourButton>View Community Feed</NeighbourButton>
      </div>
    </NeighbourCard>
  );
}
