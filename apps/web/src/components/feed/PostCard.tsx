'use client';

import { useState } from 'react';
import { deletePost, updatePost } from '@neighbour/api-client';

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

interface PostCardProps {
  post: any;
  currentUserId?: string | null;
  onPostUpdated?: () => void | Promise<void>;
}

export default function PostCard({
  post,
  currentUserId = null,
  onPostUpdated,
}: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwner = Boolean(currentUserId && post.author?.id === currentUserId);

  async function saveEdit() {
    const token = localStorage.getItem('accessToken');
    const nextContent = editContent.trim();

    if (!token || saving || !nextContent) return;

    setSaving(true);
    setEditError(null);

    try {
      await updatePost(post.id, {
        content: nextContent,
      });

      setEditing(false);

      if (onPostUpdated) {
        await onPostUpdated();
      }
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'The post could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditContent(post.content ?? '');
    setEditError(null);
    setEditing(false);
  }

  async function deleteOwnedPost() {
    if (!isOwner || deleting) return;

    const confirmed = window.confirm(
      'Delete this post? This cannot be undone.',
    );

    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deletePost(post.id);

      if (onPostUpdated) {
        await onPostUpdated();
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'The post could not be deleted.',
      );
    } finally {
      setDeleting(false);
    }
  }

  async function sharePost() {
    setShareMessage(null);

    const text = post.content?.trim() || 'Neighbour™ community post';
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Neighbour™',
          text,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setShareMessage('Post link copied.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        setShareMessage('Post link copied.');
      } catch {
        setShareMessage('Share is not available in this browser.');
      }
    }
  }

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
          {post.editedAt ? ' · Edited' : ''}
        </small>
      </header>

      {editing ? (
        <div style={{ marginTop: '22px', marginBottom: '22px' }}>
          <textarea
            autoFocus
            disabled={saving}
            onChange={(event) => setEditContent(event.target.value)}
            value={editContent}
            style={{
              width: '100%',
              minHeight: '120px',
              resize: 'vertical',
              border: '1px solid #d1d5db',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '17px',
              lineHeight: '1.5',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />

          {editError ? (
            <div
              style={{
                marginTop: '8px',
                color: '#b91c1c',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {editError}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '12px',
            }}
          >
            <button
              type="button"
              disabled={saving || !editContent.trim()}
              onClick={() => {
                void saveEdit();
              }}
              style={{
                border: 'none',
                background: '#111827',
                color: '#ffffff',
                borderRadius: '20px',
                padding: '8px 18px',
                cursor: saving ? 'default' : 'pointer',
                fontWeight: 700,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={cancelEdit}
              style={{
                border: 'none',
                background: '#f5f5f5',
                borderRadius: '20px',
                padding: '8px 18px',
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
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
      )}

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
          flexWrap: 'wrap',
        }}
      >
        <ReactionBar postId={post.id} />

        <CommentDrawer postId={post.id} />

        <ReportButton targetType="POST" targetId={post.id} />

        {isOwner ? (
          <button
            type="button"
            disabled={saving || deleting}
            onClick={() => {
              setEditContent(post.content ?? '');
              setEditError(null);
              setEditing(true);
            }}
            style={{
              border: 'none',
              background: '#f5f5f5',
              borderRadius: '20px',
              padding: '8px 18px',
              cursor: saving || deleting ? 'default' : 'pointer',
            }}
          >
            ✎ Edit
          </button>
        ) : null}

        {isOwner ? (
          <button
            type="button"
            disabled={deleting || saving}
            onClick={() => {
              void deleteOwnedPost();
            }}
            style={{
              border: '1px solid #fecaca',
              background: '#fff7f7',
              color: '#b91c1c',
              borderRadius: '20px',
              padding: '8px 18px',
              cursor: deleting || saving ? 'default' : 'pointer',
              fontWeight: 600,
            }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void sharePost();
          }}
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

        {deleteError ? (
          <small style={{ color: '#b91c1c' }}>{deleteError}</small>
        ) : null}

        {shareMessage ? (
          <small style={{ color: '#666' }}>{shareMessage}</small>
        ) : null}
      </footer>
    </article>
  );
}
