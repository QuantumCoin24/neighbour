'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getCommunityFeed, type Post } from '@neighbour/api-client';

import { NeighbourAvatar, NeighbourBadge } from '@neighbour/design-system';

interface Props {
  token: string;
  communitySlug?: string;
}

export default function FeedPreview({ token, communitySlug }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function load() {
      if (!communitySlug) {
        return;
      }

      try {
        const response = await getCommunityFeed(token, communitySlug);

        setPosts(response.items.slice(0, 4));
      } catch {
        setPosts([]);
      }
    }

    void load();
  }, [token, communitySlug]);

  return (
    <section className="feed-module">
      <div className="feed-header">
        <div>
          <div className="feed-kicker">LIVE LOCALLY</div>

          <h2>Community feed</h2>

          <p>Conversations and updates from your neighbours.</p>
        </div>

        <Link href="/community">Open feed →</Link>
      </div>

      {posts.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">✦</div>

          <div>
            <strong>Your neighbourhood feed is ready.</strong>

            <p>No posts yet. Be the first neighbour to start the conversation.</p>
          </div>

          <Link href="/community">Share an update</Link>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <article key={post.id} className="feed-post">
              <div className="feed-author">
                <NeighbourAvatar name={post.author.displayName} />

                <div>
                  <strong>{post.author.displayName}</strong>

                  <div className="feed-meta">
                    <NeighbourBadge>{post.community?.name ?? 'Neighbour'}</NeighbourBadge>
                  </div>
                </div>
              </div>

              <div className="feed-post-copy">
                <h3>{post.title ?? 'Neighbour update'}</h3>

                <p>{post.content}</p>
              </div>

              <div className="feed-post-footer">
                <span>Local update</span>
                <span>Neighbourhood</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .feed-module {
          padding: 22px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 22px;
          background: #ffffff;
          box-shadow:
            0 12px 34px
            rgba(19,45,34,.045);
        }

        .feed-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .feed-kicker {
          margin-bottom: 5px;
          color: #0a704a;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .feed-header h2 {
          margin: 0;
          color: #102019;
          font-size: 21px;
          letter-spacing: -.025em;
        }

        .feed-header p {
          margin: 5px 0 0;
          color: #7a8781;
          font-size: 12px;
        }

        .feed-header > a {
          color: #0b6846;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
        }

        .feed-empty {
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 18px;
          border: 1px solid #edf1ee;
          border-radius: 16px;
          background: #f8faf9;
        }

        .feed-empty-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #e7f4ed;
          color: #08704a;
          font-size: 18px;
        }

        .feed-empty strong {
          color: #20362c;
          font-size: 13px;
        }

        .feed-empty p {
          margin: 4px 0 0;
          color: #76827c;
          font-size: 11px;
          line-height: 1.45;
        }

        .feed-empty > a {
          padding: 10px 13px;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .feed-list {
          display: grid;
          gap: 12px;
        }

        .feed-post {
          padding: 17px;
          border: 1px solid #edf1ee;
          border-radius: 17px;
          background:
            linear-gradient(
              180deg,
              #ffffff,
              #fafcfb
            );
        }

        .feed-author {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .feed-author strong {
          color: #172c23;
          font-size: 12px;
        }

        .feed-meta {
          margin-top: 3px;
        }

        .feed-post-copy h3 {
          margin: 14px 0 6px;
          color: #172c23;
          font-size: 16px;
          letter-spacing: -.015em;
        }

        .feed-post-copy p {
          margin: 0;
          color: #64736c;
          font-size: 12px;
          line-height: 1.6;
        }

        .feed-post-footer {
          display: flex;
          gap: 12px;
          margin-top: 14px;
          color: #99a29d;
          font-size: 10px;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .feed-empty {
            grid-template-columns:
              auto minmax(0,1fr);
          }

          .feed-empty > a {
            grid-column: 1 / -1;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
