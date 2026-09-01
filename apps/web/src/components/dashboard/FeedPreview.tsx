'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  attachMediaToPost,
  createPost,
  deletePost,
  getCurrentUser,
  getHomeFeed,
  updatePost,
  type Post,
  type PostType,
} from '@neighbour/api-client';

import MediaPicker from '../media/MediaPicker';
import { uploadWebMedia, type WebPendingMedia } from '../../lib/media/upload';

type FeedPost = {
  id: string;
  content?: string | null;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  editedAt?: string | null;
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

export default function FeedPreview({ token }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerPublishing, setComposerPublishing] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [composerType, setComposerType] = useState<PostType>('STANDARD');
  const [composerMedia, setComposerMedia] = useState<WebPendingMedia[]>([]);
  const [composerUploadProgress, setComposerUploadProgress] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<{
    postId: string;
    message: string;
  } | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getHomeFeed({
        limit: 20,
      });

      setPosts(getPosts(response as FeedResponse));
    } catch {
      setError('Your Neighbour feed could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  async function publishGlobalPost() {
    const content = composerContent.trim();

    if ((!content && composerMedia.length === 0) || composerPublishing) {
      return;
    }

    setComposerPublishing(true);
    setComposerError(null);
    setComposerUploadProgress(0);

    try {
      const created = await createPost(token, {
        content,
        type: composerType,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      });

      if (composerMedia.length > 0) {
        const uploadedIds: string[] = [];

        for (let index = 0; index < composerMedia.length; index += 1) {
          const uploaded = await uploadWebMedia(composerMedia[index], (progress) => {
            const completed = index / composerMedia.length;
            const current = progress / composerMedia.length;

            setComposerUploadProgress(Math.min(1, completed + current));
          });

          uploadedIds.push(uploaded.id);
        }

        if (uploadedIds.length > 0) {
          await attachMediaToPost(created.id, uploadedIds);
        }
      }

      composerMedia.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });

      setComposerContent('');
      setComposerMedia([]);
      setComposerType('STANDARD');
      setComposerUploadProgress(0);
      setComposerOpen(false);

      await loadFeed();
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : 'The post could not be published.');
    } finally {
      setComposerPublishing(false);
    }
  }

  function openComposer(type: PostType = 'STANDARD') {
    setComposerType(type);
    setComposerError(null);
    setComposerOpen(true);
  }

  function startEditingPost(post: FeedPost) {
    setEditingPostId(post.id);
    setEditingContent(getPostText(post));
    setEditError(null);
  }

  function cancelEditingPost() {
    setEditingPostId(null);
    setEditingContent('');
    setEditError(null);
  }

  async function saveEditedPost(postId: string) {
    const content = editingContent.trim();

    if (!content || editSaving) {
      if (!content) {
        setEditError('A post cannot be empty.');
      }
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      await updatePost(postId, { content });
      cancelEditingPost();
      await loadFeed();
    } catch (caughtError) {
      setEditError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The post could not be updated.',
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteOwnedPost(post: FeedPost) {
    const author = getAuthor(post);
    const mine = Boolean(
      currentUserId && author?.id && author.id === currentUserId,
    );

    if (!mine || deletingPostId) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this post? This cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    setDeletingPostId(post.id);

    try {
      await deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));

      if (editingPostId === post.id) {
        cancelEditingPost();
      }
    } catch (caughtError) {
      window.alert(
        caughtError instanceof Error
          ? caughtError.message
          : 'The post could not be deleted.',
      );
    } finally {
      setDeletingPostId(null);
    }
  }

  async function sharePost(post: FeedPost) {
    const author = getAuthor(post);
    const authorName =
      author?.displayName?.trim() || author?.username?.trim() || 'Neighbour';
    const text = getPostText(post);
    const mediaUrl = getMediaUrl(post);
    const url = mediaUrl || window.location.href;
    const shareText = text ? `${authorName}: ${text}` : `Post from ${authorName}`;

    setShareNotice(null);

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Neighbour™ Post',
          text: shareText,
          url,
        });
        return;
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === 'AbortError'
        ) {
          return;
        }
      }
    }

    const clipboardText = [shareText, url].filter(Boolean).join('\n\n');

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard sharing is unavailable.');
      }

      await navigator.clipboard.writeText(clipboardText);
      setShareNotice({
        postId: post.id,
        message: 'Share link copied.',
      });
    } catch {
      setShareNotice({
        postId: post.id,
        message: 'Sharing is not available in this browser.',
      });
    }
  }

  useEffect(() => {
    let cancelled = false;

    void getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setCurrentUserId(currentUser.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentUserId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const visiblePosts = useMemo(() => posts.slice(0, 8), [posts]);

  return (
    <section className="neighbour-feed" aria-label="Neighbour feed">
      <header className="neighbour-feed-heading">
        <div>
          <h2>What&apos;s happening</h2>
          <p>Discover conversations, recommendations and updates from across Neighbour.</p>
        </div>

        <Link className="neighbour-feed-community-link" href="/community">
          See community
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      <button
        className="neighbour-composer"
        type="button"
        onClick={() => {
          setComposerError(null);
          setComposerOpen(true);
        }}
      >
        <span className="neighbour-composer-avatar" aria-hidden="true">
          N
        </span>

        <span className="neighbour-composer-prompt">
          <strong>Share something with Neighbour™…</strong>
          <small>Ask, recommend, share or start a conversation.</small>
        </span>

        <span className="neighbour-composer-action">
          <span aria-hidden="true">＋</span>
          Create post
        </span>
      </button>

      {composerOpen ? (
        <section className="neighbour-global-composer" aria-label="Create global Neighbour post">
          <div className="neighbour-global-composer-mode">
            <span>
              {composerType === 'LOCAL_UPDATE'
                ? '◷ Local update'
                : composerType === 'RECOMMENDATION'
                  ? '⌖ Recommendation'
                  : composerMedia.length > 0
                    ? '▧ Photo post'
                    : 'Neighbour post'}
            </span>

            <small>Public on Neighbour™</small>
          </div>

          <textarea
            autoFocus
            disabled={composerPublishing}
            maxLength={10000}
            onChange={(event) => setComposerContent(event.target.value)}
            placeholder="What's happening?"
            value={composerContent}
          />

          <div className="neighbour-global-composer-scope">
            <span aria-hidden="true">🌍</span>

            <div>
              <strong>Public on Neighbour™</strong>
              <small>Visible across the global Neighbour feed.</small>
            </div>
          </div>

          <MediaPicker
            disabled={composerPublishing}
            items={composerMedia}
            onChange={setComposerMedia}
          />

          {composerPublishing && composerMedia.length > 0 ? (
            <div className="neighbour-global-upload-progress">
              <div>
                <strong>Uploading photos</strong>
                <span>{Math.round(composerUploadProgress * 100)}%</span>
              </div>

              <div className="neighbour-global-upload-track">
                <span
                  style={{
                    width: `${Math.max(2, composerUploadProgress * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {composerError ? (
            <p className="neighbour-global-composer-error">{composerError}</p>
          ) : null}

          <div className="neighbour-global-composer-actions">
            <button
              disabled={composerPublishing}
              type="button"
              onClick={() => {
                setComposerContent('');
                setComposerError(null);
                setComposerOpen(false);
              }}
            >
              Cancel
            </button>

            <button
              disabled={
                composerPublishing || (!composerContent.trim() && composerMedia.length === 0)
              }
              type="button"
              onClick={() => void publishGlobalPost()}
            >
              {composerPublishing ? 'Publishing…' : 'Post globally'}
            </button>
          </div>
        </section>
      ) : null}

      <div className="neighbour-composer-tools" aria-label="Post shortcuts">
        <button
          type="button"
          onClick={() => {
            setComposerType('STANDARD');
            setComposerError(null);
            setComposerOpen(true);
          }}
        >
          <span aria-hidden="true">▧</span>
          Photo
        </button>

        <button type="button" onClick={() => openComposer('LOCAL_UPDATE')}>
          <span aria-hidden="true">◷</span>
          Local update
        </button>

        <button type="button" onClick={() => openComposer('RECOMMENDATION')}>
          <span aria-hidden="true">⌖</span>
          Recommendation
        </button>
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
            const mine = Boolean(
              currentUserId && author?.id && author.id === currentUserId,
            );
            const editing = editingPostId === post.id;

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

                  {mine ? (
                    <button
                      aria-label="Edit post"
                      className="neighbour-post-menu"
                      type="button"
                      onClick={() => {
                        startEditingPost(post);
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <Link
                      aria-label="Open community"
                      className="neighbour-post-menu"
                      href="/community"
                    >
                      •••
                    </Link>
                  )}
                </div>

                {editing ? (
                  <div className="neighbour-post-editor">
                    <textarea
                      aria-label="Edit post content"
                      className="neighbour-post-edit-input"
                      disabled={editSaving}
                      rows={4}
                      value={editingContent}
                      onChange={(event) => {
                        setEditingContent(event.target.value);
                        if (editError) {
                          setEditError(null);
                        }
                      }}
                    />

                    {editError ? (
                      <p className="neighbour-post-edit-error">{editError}</p>
                    ) : null}

                    <div className="neighbour-post-edit-actions">
                      <button
                        disabled={editSaving || !editingContent.trim()}
                        type="button"
                        onClick={() => {
                          void saveEditedPost(post.id);
                        }}
                      >
                        {editSaving ? 'Saving…' : 'Save'}
                      </button>

                      <button
                        disabled={editSaving}
                        type="button"
                        onClick={cancelEditingPost}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : text ? (
                  <p className="neighbour-post-content">{text}</p>
                ) : null}

                {!editing && post.editedAt ? (
                  <span className="neighbour-post-edited">Edited</span>
                ) : null}

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

                  <button
                    type="button"
                    onClick={() => {
                      void sharePost(post);
                    }}
                  >
                    <span aria-hidden="true">↗</span>
                    Share
                  </button>
                  {mine ? (
                    <button
                      aria-label="Delete post"
                      disabled={deletingPostId === post.id}
                      type="button"
                      onClick={() => {
                        void deleteOwnedPost(post);
                      }}
                    >
                      <span aria-hidden="true">×</span>
                      {deletingPostId === post.id ? 'Deleting…' : 'Delete'}
                    </button>
                  ) : null}
                </div>

                {shareNotice?.postId === post.id ? (
                  <span className="neighbour-post-share-notice">
                    {shareNotice.message}
                  </span>
                ) : null}
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

        .neighbour-post-menu {
          font: inherit;
        }

        button.neighbour-post-menu {
          cursor: pointer;
        }

        .neighbour-post-editor {
          display: grid;
          gap: 10px;
        }

        .neighbour-post-edit-input {
          width: 100%;
          min-height: 110px;
          resize: vertical;
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 14px;
          padding: 12px 14px;
          font: inherit;
          line-height: 1.5;
          background: transparent;
          color: inherit;
        }

        .neighbour-post-edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .neighbour-post-edit-actions button,
        .neighbour-post-actions button {
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        .neighbour-post-edit-actions button {
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 999px;
          padding: 8px 14px;
        }

        .neighbour-post-edit-actions button:disabled {
          cursor: default;
          opacity: 0.55;
        }

        .neighbour-post-edit-error {
          margin: 0;
          font-size: 0.86rem;
        }

        .neighbour-post-edited,
        .neighbour-post-share-notice {
          display: block;
          margin-top: 7px;
          font-size: 0.78rem;
          opacity: 0.68;
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

        .neighbour-composer-tools button {
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

        .neighbour-composer-tools button + button {
          border-left: 1px solid rgba(15, 74, 53, 0.065);
        }

        .neighbour-composer-tools button:hover {
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

          .neighbour-composer-tools button {
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

      <style jsx>{`
        /*
         * BUILD 97D — PREMIUM FEED POLISH
         */

        .neighbour-feed-heading {
          align-items: center;
          gap: 20px;
          margin-bottom: 14px;
          padding: 1px 2px 0;
        }

        .neighbour-feed-heading h2 {
          font-size: clamp(25px, 2.5vw, 34px);
          line-height: 1.03;
          letter-spacing: -0.047em;
        }

        .neighbour-feed-heading p {
          max-width: 650px;
          margin-top: 6px;
          font-size: 11px;
          line-height: 1.5;
        }

        .neighbour-feed-community-link {
          padding: 9px 13px;
          border-color: rgba(16, 87, 62, 0.11);
          background: #f6faf8;
          color: #315247;
          box-shadow: none;
        }

        /*
         * Primary social composer.
         */
        .neighbour-composer {
          gap: 14px;
          min-height: 70px;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid rgba(13, 92, 64, 0.105);
          border-radius: 20px;
          background:
            radial-gradient(circle at 100% 0%, rgba(21, 139, 91, 0.065), transparent 30%),
            linear-gradient(135deg, #ffffff, #fbfdfc);
          box-shadow: 0 14px 38px rgba(18, 48, 36, 0.055);
        }

        .neighbour-composer:hover {
          border-color: rgba(7, 112, 72, 0.2);
          box-shadow: 0 18px 48px rgba(18, 48, 36, 0.085);
        }

        .neighbour-composer-avatar {
          width: 44px;
          height: 44px;
          flex-basis: 44px;
          border-radius: 14px;
        }

        .neighbour-composer-prompt strong {
          color: #20362c;
          font-size: 12px;
        }

        .neighbour-composer-prompt small {
          margin-top: 4px;
          color: #88958e;
          font-size: 8px;
        }

        .neighbour-composer-action {
          padding: 10px 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, #08704a, #07583a);
          color: #ffffff;
          font-size: 9px;
          box-shadow: 0 9px 22px rgba(7, 88, 58, 0.17);
        }

        /*
         * Composer shortcuts become pills.
         */
        .neighbour-composer-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 8px 0 17px;
          padding: 0;
          border: 0;
          border-radius: 0;
          overflow: visible;
          background: transparent;
        }

        .neighbour-composer-tools button {
          flex: 0 0 auto;
          appearance: none;
          cursor: pointer;
          font-family: inherit;
          gap: 5px;
          min-height: 31px;
          box-sizing: border-box;
          padding: 0 10px;
          border: 1px solid rgba(15, 82, 58, 0.08);
          border-radius: 999px;
          background: #f6faf8;
          color: #566b60;
          font-size: 8px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(22, 53, 41, 0.025);
        }

        .neighbour-composer-tools button + button {
          border-left: 1px solid rgba(15, 82, 58, 0.08);
        }

        .neighbour-composer-tools button:hover {
          border-color: rgba(8, 112, 74, 0.15);
          background: #edf7f1;
          color: #08704a;
        }

        /*
         * Strong empty-state CTA.
         */
        .neighbour-feed-empty {
          gap: 18px;
          padding: 27px;
          border-color: rgba(19, 76, 54, 0.085);
          background:
            radial-gradient(circle at 100% 0%, rgba(19, 134, 89, 0.09), transparent 34%),
            linear-gradient(145deg, #ffffff, #fbfdfc);
        }

        .neighbour-feed-empty-mark {
          width: 52px;
          height: 52px;
          border-radius: 17px;
        }

        .neighbour-feed-empty h3 {
          font-size: 15px;
        }

        .neighbour-feed-empty p {
          max-width: 470px;
          font-size: 9px;
        }

        .neighbour-feed-empty > a,
        .neighbour-feed-empty > a:visited {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          box-sizing: border-box;
          padding: 0 15px;
          border: 1px solid #07583a;
          border-radius: 12px;
          background: #07583a;
          color: #ffffff !important;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 9px 22px rgba(7, 88, 58, 0.16);
          transition:
            transform 0.16s ease,
            background 0.16s ease,
            box-shadow 0.16s ease;
        }

        .neighbour-feed-empty > a:hover {
          transform: translateY(-1px);
          background: #064b32;
          box-shadow: 0 12px 27px rgba(7, 88, 58, 0.21);
        }

        /*
         * Premium post rhythm.
         */
        .neighbour-feed-stream {
          gap: 16px;
        }

        .neighbour-post {
          border-radius: 21px;
        }

        .neighbour-post-topline {
          padding: 18px 19px 0;
        }

        .neighbour-post-content {
          margin: 15px 19px 16px;
          font-size: 12px;
          line-height: 1.67;
        }

        .neighbour-post-media {
          margin: 0 13px;
          border-radius: 17px;
        }

        /*
         * Unified accessible interaction.
         */
        .neighbour-post-actions a:focus-visible,
        .neighbour-composer:focus-visible,
        .neighbour-composer-tools button:focus-visible,
        .neighbour-feed-empty > a:focus-visible,
        .neighbour-feed-community-link:focus-visible {
          outline: 3px solid rgba(20, 126, 83, 0.22);
          outline-offset: 3px;
        }

        @media (max-width: 720px) {
          .neighbour-feed-heading h2 {
            font-size: 27px;
          }

          .neighbour-composer {
            min-height: 64px;
          }

          .neighbour-composer-action {
            padding: 9px 10px;
          }

          .neighbour-composer-tools {
            gap: 5px;
          }

          .neighbour-feed-empty {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .neighbour-feed-empty > a {
            grid-column: 1 / -1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neighbour-composer,
          .neighbour-composer-tools a,
          .neighbour-feed-empty > a {
            transition: none;
          }
        }

        /*
         * BUILD 98B — GLOBAL HOME COMPOSER
         * Public Neighbour publishing surface.
         */
        .neighbour-global-composer {
          display: grid;
          gap: 12px;
          margin-bottom: 8px;
          padding: 16px;
          border: 1px solid rgba(13, 92, 64, 0.11);
          border-radius: 22px;
          background:
            radial-gradient(circle at 100% 0%, rgba(21, 139, 91, 0.08), transparent 34%),
            linear-gradient(145deg, #ffffff, #fbfdfc);
          box-shadow: 0 16px 42px rgba(18, 48, 36, 0.06);
        }

        .neighbour-global-composer-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .neighbour-global-composer-avatar {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: linear-gradient(145deg, #0c7850, #064c33);
          color: #ffffff;
          font-size: 14px;
          font-weight: 950;
          box-shadow: 0 9px 22px rgba(6, 89, 57, 0.17);
        }

        .neighbour-global-composer-main {
          min-width: 0;
          flex: 1;
          display: grid;
          gap: 8px;
        }

        .neighbour-global-composer-audience {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border: 1px solid rgba(11, 101, 69, 0.09);
          border-radius: 999px;
          background: #f1f8f4;
          color: #356052;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.01em;
        }

        .neighbour-global-composer textarea {
          width: 100%;
          min-height: 84px;
          box-sizing: border-box;
          resize: vertical;
          padding: 12px 13px;
          border: 1px solid rgba(20, 75, 55, 0.09);
          border-radius: 16px;
          outline: none;
          background: #f8fbf9;
          color: #20362c;
          font: inherit;
          font-size: 12px;
          line-height: 1.55;
          transition:
            border-color 0.16s ease,
            background 0.16s ease,
            box-shadow 0.16s ease;
        }

        .neighbour-global-composer textarea::placeholder {
          color: #89978f;
        }

        .neighbour-global-composer textarea:focus {
          border-color: rgba(8, 112, 74, 0.28);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(8, 112, 74, 0.07);
        }

        .neighbour-global-composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .neighbour-global-composer-hint {
          color: #839189;
          font-size: 8px;
          font-weight: 700;
        }

        .neighbour-global-composer-publish {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 14px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #08704a, #07583a);
          color: #ffffff;
          font: inherit;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 9px 22px rgba(7, 88, 58, 0.17);
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            opacity 0.16s ease;
        }

        .neighbour-global-composer-publish:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 13px 28px rgba(7, 88, 58, 0.22);
        }

        .neighbour-global-composer-publish:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .neighbour-global-composer-publish:focus-visible,
        .neighbour-global-composer textarea:focus-visible {
          outline: 3px solid rgba(20, 126, 83, 0.22);
          outline-offset: 3px;
        }

        .neighbour-global-composer-error {
          margin: 0;
          padding: 8px 10px;
          border-radius: 11px;
          background: rgba(173, 43, 43, 0.07);
          color: #9a3030;
          font-size: 8px;
          font-weight: 750;
        }

        @media (max-width: 720px) {
          .neighbour-global-composer {
            padding: 13px;
            border-radius: 19px;
          }

          .neighbour-global-composer-avatar {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
          }

          .neighbour-global-composer-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .neighbour-global-composer-publish {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neighbour-global-composer textarea,
          .neighbour-global-composer-publish {
            transition: none;
          }
        }

        /*
         * BUILD 98C — GLOBAL COMPOSER MODES
         * Photo, Local Update and Recommendation.
         */
        .neighbour-global-composer-mode {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 11px;
          border: 1px solid rgba(13, 92, 64, 0.08);
          border-radius: 13px;
          background: #f5faf7;
        }

        .neighbour-global-composer-mode span {
          color: #07583a;
          font-size: 10px;
          font-weight: 900;
        }

        .neighbour-global-composer-mode small {
          color: #708078;
          font-size: 8px;
          font-weight: 800;
        }

        .neighbour-global-upload-progress {
          display: grid;
          gap: 7px;
          padding: 10px 12px;
          border-radius: 13px;
          background: #f2f8f4;
        }

        .neighbour-global-upload-progress > div:first-child {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #365448;
          font-size: 9px;
        }

        .neighbour-global-upload-track {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: #dce9e1;
        }

        .neighbour-global-upload-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #08704a;
          transition: width 0.2s ease;
        }
      `}</style>
    </section>
  );
}
