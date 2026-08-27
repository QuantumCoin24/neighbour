'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCommunityFeed, type Post } from '@neighbour/api-client';

type FeedPost = {
  id: string;
  content?: string | null;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  media?: Array<{
    id?: string;
    url?: string | null;
    type?: string | null;
  }> | null;
  author?: {
    id?: string;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  } | null;
  user?: {
    id?: string;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  } | null;
  reactionsCount?: number | null;
  reactionCount?: number | null;
  commentsCount?: number | null;
  commentCount?: number | null;
};

type FeedResponse =
  | FeedPost[]
  | {
      items?: FeedPost[];
      posts?: FeedPost[];
      data?: FeedPost[];
    };

type Props = {
  token: string;
  communitySlug?: string;
};

function getPosts(response: FeedResponse | null | undefined): FeedPost[] {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.posts)) {
    return response.posts;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function getAuthor(post: FeedPost) {
  return post.author ?? post.user ?? null;
}

function getPostText(post: FeedPost): string {
  return post.content?.trim() || post.body?.trim() || '';
}

function getMediaUrl(post: FeedPost): string | null {
  if (post.imageUrl) {
    return post.imageUrl;
  }

  if (post.mediaUrl) {
    return post.mediaUrl;
  }

  const media = post.media?.find((item) => item?.url);

  return media?.url ?? null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return 'N';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function formatRelativeTime(value?: string | null): string {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const difference = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) {
    return 'Just now';
  }

  if (difference < hour) {
    const minutes = Math.max(1, Math.floor(difference / minute));
    return `${minutes}m`;
  }

  if (difference < day) {
    const hours = Math.max(1, Math.floor(difference / hour));
    return `${hours}h`;
  }

  if (difference < day * 7) {
    const days = Math.max(1, Math.floor(difference / day));
    return `${days}d`;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export default function FeedPreview({ token, communitySlug }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (!communitySlug) {
      setPosts([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getCommunityFeed(token, communitySlug);

      setPosts(getPosts(response as FeedResponse));
    } catch {
      setError('Your neighbourhood feed could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [token, communitySlug]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const visiblePosts = useMemo(() => posts.slice(0, 8), [posts]);

  return (
    <section className="neighbour-feed" aria-label="Neighbourhood feed">
      <header className="neighbour-feed-heading">
        <div>
          <span className="neighbour-feed-eyebrow">YOUR NEIGHBOURHOOD</span>
          <h2>What&apos;s happening near you</h2>
          <p>Real conversations, recommendations and updates from your local community.</p>
        </div>

        <Link className="neighbour-feed-community-link" href="/community">
          See community
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      <Link className="neighbour-composer" href="/community">
        <span className="neighbour-composer-avatar" aria-hidden="true">
          N
        </span>

        <span className="neighbour-composer-prompt">
          <strong>Share something with your neighbours</strong>
          <small>What&apos;s happening near you?</small>
        </span>

        <span className="neighbour-composer-action">
          <span aria-hidden="true">＋</span>
          Create post
        </span>
      </Link>

      <div className="neighbour-composer-tools" aria-label="Post shortcuts">
        <Link href="/community">
          <span aria-hidden="true">▧</span>
          Photo
        </Link>

        <Link href="/community">
          <span aria-hidden="true">◷</span>
          Local update
        </Link>

        <Link href="/community">
          <span aria-hidden="true">⌖</span>
          Recommendation
        </Link>
      </div>

      {loading ? (
        <div className="neighbour-feed-state">
          <span className="neighbour-feed-loader" />
          <strong>Loading your neighbourhood</strong>
          <p>Finding the latest conversations around you…</p>
        </div>
      ) : error ? (
        <div className="neighbour-feed-state">
          <span className="neighbour-feed-state-icon" aria-hidden="true">
            ↻
          </span>
          <strong>Couldn&apos;t refresh your neighbourhood</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void loadFeed()}>
            Try again
          </button>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="neighbour-feed-empty">
          <span className="neighbour-feed-empty-mark" aria-hidden="true">
            N
          </span>
          <div>
            <span className="neighbour-feed-eyebrow">START LOCAL</span>
            <h3>Your neighbourhood starts with one conversation.</h3>
            <p>Ask a question, share an update or recommend somewhere worth knowing.</p>
          </div>
          <Link href="/community">Start a conversation</Link>
        </div>
      ) : (
        <div className="neighbour-feed-stream">
          {visiblePosts.map((post) => {
            const author = getAuthor(post);
            const authorName =
              author?.displayName?.trim() || author?.username?.trim() || 'Neighbour';
            const username = author?.username?.trim();
            const text = getPostText(post);
            const mediaUrl = getMediaUrl(post);
            const reactionCount = post.reactionsCount ?? post.reactionCount ?? 0;
            const commentCount = post.commentsCount ?? post.commentCount ?? 0;

            return (
              <article className="neighbour-post" key={post.id}>
                <div className="neighbour-post-topline">
                  <div className="neighbour-post-author">
                    {author?.avatarUrl ? (
                      <img alt="" className="neighbour-post-avatar" src={author.avatarUrl} />
                    ) : (
                      <span
                        className="neighbour-post-avatar neighbour-post-avatar-fallback"
                        aria-hidden="true"
                      >
                        {getInitials(authorName)}
                      </span>
                    )}

                    <div>
                      <div className="neighbour-post-name-line">
                        <strong>{authorName}</strong>
                        <span className="neighbour-post-local-badge" title="Local neighbour">
                          Local
                        </span>
                      </div>

                      <div className="neighbour-post-meta">
                        {username ? <span>@{username}</span> : null}
                        {username ? <span>·</span> : null}
                        <span>{formatRelativeTime(post.createdAt ?? post.updatedAt)}</span>
                        <span>·</span>
                        <span>Neighbourhood</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    aria-label="Open community"
                    className="neighbour-post-menu"
                    href="/community"
                  >
                    •••
                  </Link>
                </div>

                {text ? <p className="neighbour-post-content">{text}</p> : null}

                {mediaUrl ? (
                  <Link className="neighbour-post-media" href="/community" aria-label="Open post">
                    <img alt="" src={mediaUrl} />
                  </Link>
                ) : null}

                <div className="neighbour-post-social-proof">
                  <span>
                    {reactionCount > 0
                      ? `${reactionCount} ${reactionCount === 1 ? 'reaction' : 'reactions'}`
                      : 'Be the first to react'}
                  </span>

                  <span>
                    {commentCount > 0
                      ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`
                      : 'Join the conversation'}
                  </span>
                </div>

                <div className="neighbour-post-actions">
                  <Link href="/community">
                    <span aria-hidden="true">♡</span>
                    Like
                  </Link>

                  <Link href="/community">
                    <span aria-hidden="true">◯</span>
                    Comment
                  </Link>

                  <Link href="/community">
                    <span aria-hidden="true">↗</span>
                    Share
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {posts.length > visiblePosts.length ? (
        <Link className="neighbour-feed-more" href="/community">
          Continue exploring your neighbourhood
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}

      <style jsx>{`
        .neighbour-feed {
          min-width: 0;
        }

        .neighbour-feed-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 16px;
          padding: 0 4px;
        }

        .neighbour-feed-eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #77877f;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        .neighbour-feed-heading h2 {
          margin: 0;
          color: #102019;
          font-size: clamp(22px, 2vw, 29px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.04em;
        }

        .neighbour-feed-heading p {
          max-width: 570px;
          margin: 7px 0 0;
          color: #748179;
          font-size: 11px;
          line-height: 1.55;
        }

        .neighbour-feed-community-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          flex: 0 0 auto;
          padding: 9px 12px;
          border: 1px solid rgba(18, 48, 38, 0.08);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #315247;
          font-size: 10px;
          font-weight: 850;
          text-decoration: none;
          box-shadow: 0 7px 20px rgba(22, 54, 42, 0.035);
          transition:
            transform 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease;
        }

        .neighbour-feed-community-link:hover {
          transform: translateY(-1px);
          border-color: rgba(9, 112, 73, 0.2);
          box-shadow: 0 10px 25px rgba(22, 54, 42, 0.07);
        }

        .neighbour-composer {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px;
          border: 1px solid rgba(15, 74, 53, 0.09);
          border-radius: 22px 22px 0 0;
          background:
            radial-gradient(circle at 100% 0%, rgba(14, 127, 82, 0.065), transparent 34%), #fff;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 16px 42px rgba(21, 51, 40, 0.055);
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .neighbour-composer:hover {
          border-color: rgba(7, 112, 72, 0.2);
          box-shadow: 0 18px 48px rgba(21, 51, 40, 0.085);
        }

        .neighbour-composer-avatar {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(145deg, #0c7850, #064c33);
          color: #fff;
          font-size: 14px;
          font-weight: 950;
          box-shadow: 0 8px 18px rgba(6, 89, 57, 0.17);
        }

        .neighbour-composer-prompt {
          min-width: 0;
          flex: 1;
        }

        .neighbour-composer-prompt strong,
        .neighbour-composer-prompt small {
          display: block;
        }

        .neighbour-composer-prompt strong {
          color: #21382e;
          font-size: 12px;
          font-weight: 850;
        }

        .neighbour-composer-prompt small {
          margin-top: 3px;
          color: #8a9690;
          font-size: 9px;
        }

        .neighbour-composer-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 9px 12px;
          border-radius: 12px;
          background: #07583a;
          color: white;
          font-size: 9px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(7, 88, 58, 0.13);
        }

        .neighbour-composer-tools {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid rgba(15, 74, 53, 0.08);
          border-top: 0;
          border-radius: 0 0 20px 20px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.9);
          margin-bottom: 18px;
        }

        .neighbour-composer-tools a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 8px;
          color: #60736a;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .neighbour-composer-tools a + a {
          border-left: 1px solid rgba(15, 74, 53, 0.065);
        }

        .neighbour-composer-tools a:hover {
          background: #f2f8f4;
          color: #08704a;
        }

        .neighbour-feed-stream {
          display: grid;
          gap: 15px;
        }

        .neighbour-post {
          overflow: hidden;
          border: 1px solid rgba(19, 58, 43, 0.075);
          border-radius: 23px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 14px 40px rgba(18, 46, 35, 0.05);
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .neighbour-post:hover {
          transform: translateY(-2px);
          border-color: rgba(9, 112, 73, 0.13);
          box-shadow: 0 20px 52px rgba(18, 46, 35, 0.08);
        }

        .neighbour-post-topline {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          padding: 17px 18px 0;
        }

        .neighbour-post-author {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .neighbour-post-avatar {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 14px;
          object-fit: cover;
          background: #edf4f0;
          box-shadow: 0 0 0 1px rgba(14, 75, 52, 0.07);
        }

        .neighbour-post-avatar-fallback {
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.22), transparent 45%),
            linear-gradient(145deg, #16815a, #07583a);
          color: white;
          font-size: 11px;
          font-weight: 950;
        }

        .neighbour-post-name-line {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .neighbour-post-name-line strong {
          overflow: hidden;
          color: #172b22;
          font-size: 12px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .neighbour-post-local-badge {
          padding: 3px 6px;
          border-radius: 999px;
          background: #eaf6ef;
          color: #08704a;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .neighbour-post-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
          color: #929d97;
          font-size: 8px;
          font-weight: 650;
        }

        .neighbour-post-menu {
          padding: 5px 2px;
          color: #9ca59f;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          text-decoration: none;
        }

        .neighbour-post-content {
          margin: 14px 18px 15px;
          color: #30443a;
          font-size: 12px;
          line-height: 1.65;
          white-space: pre-wrap;
        }

        .neighbour-post-media {
          display: block;
          overflow: hidden;
          margin: 0 12px;
          border-radius: 17px;
          background: #edf3ef;
          aspect-ratio: 16 / 9;
        }

        .neighbour-post-media img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .neighbour-post:hover .neighbour-post-media img {
          transform: scale(1.012);
        }

        .neighbour-post-social-proof {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 11px 18px 9px;
          color: #89958e;
          font-size: 8px;
          font-weight: 650;
        }

        .neighbour-post-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid rgba(19, 58, 43, 0.065);
          padding: 5px;
        }

        .neighbour-post-actions a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 6px;
          border-radius: 11px;
          color: #65766d;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
          transition:
            color 0.15s ease,
            background 0.15s ease;
        }

        .neighbour-post-actions a:hover {
          background: #f0f7f3;
          color: #08704a;
        }

        .neighbour-feed-state,
        .neighbour-feed-empty {
          border: 1px solid rgba(19, 58, 43, 0.075);
          border-radius: 23px;
          background:
            radial-gradient(circle at 100% 0%, rgba(14, 127, 82, 0.07), transparent 37%), #fff;
          box-shadow: 0 14px 40px rgba(18, 46, 35, 0.05);
        }

        .neighbour-feed-state {
          display: grid;
          justify-items: center;
          padding: 42px 24px;
          text-align: center;
        }

        .neighbour-feed-state strong {
          margin-top: 12px;
          color: #21382e;
          font-size: 13px;
        }

        .neighbour-feed-state p {
          max-width: 420px;
          margin: 6px 0 0;
          color: #849088;
          font-size: 9px;
          line-height: 1.55;
        }

        .neighbour-feed-state button {
          margin-top: 14px;
          padding: 9px 13px;
          border: 0;
          border-radius: 11px;
          background: #07583a;
          color: white;
          cursor: pointer;
          font: inherit;
          font-size: 9px;
          font-weight: 850;
        }

        .neighbour-feed-loader {
          width: 25px;
          height: 25px;
          border: 3px solid #e2eee8;
          border-top-color: #08704a;
          border-radius: 50%;
          animation: neighbour-spin 0.8s linear infinite;
        }

        .neighbour-feed-state-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #edf6f1;
          color: #08704a;
          font-size: 15px;
          font-weight: 900;
        }

        .neighbour-feed-empty {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          padding: 25px;
        }

        .neighbour-feed-empty-mark {
          width: 49px;
          height: 49px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(145deg, #13805a, #07583a);
          color: white;
          font-size: 16px;
          font-weight: 950;
          box-shadow: 0 10px 25px rgba(7, 88, 58, 0.15);
        }

        .neighbour-feed-empty h3 {
          margin: 0;
          color: #1e3329;
          font-size: 14px;
          letter-spacing: -0.025em;
        }

        .neighbour-feed-empty p {
          margin: 5px 0 0;
          color: #7c8982;
          font-size: 9px;
          line-height: 1.55;
        }

        .neighbour-feed-empty > a {
          padding: 10px 12px;
          border-radius: 12px;
          background: #07583a;
          color: white;
          font-size: 9px;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .neighbour-feed-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 14px;
          padding: 12px;
          border: 1px solid rgba(19, 58, 43, 0.075);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.78);
          color: #315247;
          font-size: 9px;
          font-weight: 850;
          text-decoration: none;
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .neighbour-feed-more:hover {
          background: #fff;
          border-color: rgba(8, 112, 74, 0.18);
        }

        @keyframes neighbour-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 720px) {
          .neighbour-feed-heading {
            align-items: flex-start;
          }

          .neighbour-feed-community-link {
            display: none;
          }

          .neighbour-composer-action {
            padding: 8px;
          }

          .neighbour-composer-action > span {
            display: none;
          }

          .neighbour-composer-tools a {
            font-size: 8px;
          }

          .neighbour-feed-empty {
            grid-template-columns: auto 1fr;
          }

          .neighbour-feed-empty > a {
            grid-column: 1 / -1;
            text-align: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neighbour-feed-loader {
            animation: none;
          }

          .neighbour-post,
          .neighbour-post-media img,
          .neighbour-composer,
          .neighbour-feed-community-link {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
