'use client';

import ReactionBar from './ReactionBar';
import CommentDrawer from './CommentDrawer';
import ReportButton from '../security/ReportButton';
import MediaGallery from '../media/MediaGallery';

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return 'just now';

  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;

  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function PostCard({ post }: { post: any }) {
  return (
    <article
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '22px',
        padding: '24px',
        marginBottom: '22px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            👤
          </div>

          <div>
            <strong
              style={{
                fontSize: '17px',
              }}
            >
              {post.author?.displayName ?? 'Neighbour'}
            </strong>

            <div>
              <small>@{post.author?.username ?? 'neighbour'}</small>
            </div>

            <div>
              <small
                style={{
                  color: '#666',
                }}
              >
                📍 {post.community?.name ?? 'Community'}
              </small>
            </div>
          </div>
        </div>

        <small
          style={{
            color: '#777',
          }}
        >
          {post.createdAt && timeAgo(post.createdAt)}
        </small>
      </header>

      <p
        style={{
          fontSize: '19px',
          lineHeight: '1.5',
          marginTop: '22px',
          marginBottom: '22px',
        }}
      >
        {post.content}
      </p>

      {Array.isArray(post.media) && post.media.length > 0 ? (
        <MediaGallery items={post.media} />
      ) : null}

      <footer
        style={{
          borderTop: '1px solid #eee',
          paddingTop: '14px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <ReactionBar postId={post.id} />

        <CommentDrawer postId={post.id} />

        <ReportButton targetType="POST" targetId={post.id} />

        <button
          style={{
            border: 'none',
            background: '#f5f5f5',
            borderRadius: '20px',
            padding: '8px 18px',
            cursor: 'pointer',
          }}
        >
          ↗ Share
        </button>
      </footer>
    </article>
  );
}
