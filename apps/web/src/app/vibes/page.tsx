'use client';

import {
  type LiveSession,
  getActiveLiveSessions,
  createVibe,
  createVibeComment,
  getVibeComments,
  getVibesFeed,
  reactToVibe,
  recordVibeView,
  removeVibeReaction,
  saveVibe,
  unsaveVibe,
  type Vibe,
  type VibeComment,
  type VibeFeedMode,
  type VibeReactionType,
} from '@neighbour/api-client';
import { useCallback, useEffect, useRef, useState } from 'react';

import WebLiveStudio from '../../components/vibes/WebLiveStudio';
import WebLiveViewer from '../../components/vibes/WebLiveViewer';
import { uploadWebMedia, type WebPendingMedia } from '../../lib/media/upload';

const reactionOptions: VibeReactionType[] = ['LIKE', 'LOVE', 'FIRE', 'LAUGH', 'WOW'];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function VibeMedia({ vibe }: { vibe: Vibe }) {
  const media = vibe.media[0];

  if (!media?.publicUrl) {
    return (
      <div className="vibe-media vibe-media-empty">
        <div className="vibe-media-mark">N</div>
        <span>Neighbour™ Vibe</span>
      </div>
    );
  }

  if (media.mimeType.startsWith('video/')) {
    return (
      <video className="vibe-media" controls playsInline preload="metadata" src={media.publicUrl} />
    );
  }

  return <img className="vibe-media" src={media.publicUrl} alt={vibe.caption ?? 'Vibe'} />;
}

function Comments({
  vibe,
  onClose,
  onIncrement,
}: {
  vibe: Vibe;
  onClose: () => void;
  onIncrement: () => void;
}) {
  const [items, setItems] = useState<VibeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;

    getVibeComments(vibe.id)
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [vibe.id]);

  async function submit(): Promise<void> {
    const value = content.trim();

    if (!value || sending) return;

    try {
      setSending(true);

      const created = await createVibeComment(vibe.id, {
        content: value,
      });

      setItems((current) => [...current, created]);
      setContent('');
      onIncrement();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="vibes-comments-overlay" onMouseDown={onClose}>
      <aside className="vibes-comments" onMouseDown={(event) => event.stopPropagation()}>
        <div className="vibes-comments-header">
          <div>
            <span>VIBE DISCUSSION</span>
            <h2>Comments</h2>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="vibes-comments-list">
          {loading ? (
            <div className="vibes-comments-state">Loading comments…</div>
          ) : items.length === 0 ? (
            <div className="vibes-comments-state">Be the first to comment.</div>
          ) : (
            items.map((comment) => (
              <article className="vibes-comment" key={comment.id}>
                <div className="vibes-comment-avatar">
                  {comment.author.displayName.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <strong>{comment.author.displayName}</strong>
                  <p>{comment.content}</p>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="vibes-comment-composer">
          <input
            value={content}
            placeholder="Add a comment…"
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
          />

          <button type="button" disabled={!content.trim() || sending} onClick={() => void submit()}>
            {sending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function VibesPage() {
  const [mode, setMode] = useState<VibeFeedMode>('FOR_YOU');
  const [items, setItems] = useState<Vibe[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState('');
  const [commentsVibeId, setCommentsVibeId] = useState<string | null>(null);
  const [liveStudioOpen, setLiveStudioOpen] = useState(false);
  const [createVibeOpen, setCreateVibeOpen] = useState(false);
  const [createCaption, setCreateCaption] = useState('');
  const [creatingVibe, setCreatingVibe] = useState(false);
  const [createMedia, setCreateMedia] = useState<WebPendingMedia | null>(null);
  const [createMediaProgress, setCreateMediaProgress] = useState(0);
  const [createMediaError, setCreateMediaError] = useState<string | null>(null);
  const createMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [activeLiveSessions, setActiveLiveSessions] = useState<LiveSession[]>([]);
  const [activeLiveLoading, setActiveLiveLoading] = useState(false);
  const [selectedLiveSession, setSelectedLiveSession] = useState<LiveSession | null>(null);

  const viewedRef = useRef(new Set<string>());

  const load = useCallback(
    async (cursor?: string): Promise<void> => {
      try {
        if (cursor) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        setMessage('');

        const response = await getVibesFeed({
          mode,
          limit: 12,
          ...(cursor ? { cursor } : {}),
        });

        setItems((current) => (cursor ? [...current, ...response.items] : response.items));
        setNextCursor(response.nextCursor);
      } catch {
        setMessage('Unable to load Vibes right now.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mode],
  );

  useEffect(() => {
    viewedRef.current.clear();
    void load();
  }, [load]);

  function markViewed(vibe: Vibe): void {
    if (viewedRef.current.has(vibe.id)) return;

    viewedRef.current.add(vibe.id);

    void recordVibeView(vibe.id, {
      sessionKey: `web-${Date.now()}-${vibe.id}`,
      watchTimeMs: 1000,
      replay: false,
    }).catch(() => undefined);
  }

  async function react(vibe: Vibe, type: VibeReactionType): Promise<void> {
    const updated =
      vibe.engagement.myReaction === type
        ? await removeVibeReaction(vibe.id).then(() => ({
            ...vibe,
            engagement: {
              ...vibe.engagement,
              myReaction: null,
              reactionCount: Math.max(0, vibe.engagement.reactionCount - 1),
            },
          }))
        : await reactToVibe(vibe.id, type);

    setItems((current) => current.map((item) => (item.id === vibe.id ? updated : item)));
  }

  async function toggleSave(vibe: Vibe): Promise<void> {
    if (vibe.engagement.savedByMe) {
      await unsaveVibe(vibe.id);
    } else {
      await saveVibe(vibe.id);
    }

    setItems((current) =>
      current.map((item) =>
        item.id === vibe.id
          ? {
              ...item,
              engagement: {
                ...item.engagement,
                savedByMe: !item.engagement.savedByMe,
                saveCount: item.engagement.savedByMe
                  ? Math.max(0, item.engagement.saveCount - 1)
                  : item.engagement.saveCount + 1,
              },
            }
          : item,
      ),
    );
  }

  const loadActiveLiveSessions = useCallback(async (): Promise<void> => {
    try {
      setActiveLiveLoading(true);

      const sessions = await getActiveLiveSessions();

      setActiveLiveSessions(sessions);
    } catch (cause) {
      console.error('Unable to load active Live Vibes', cause);
    } finally {
      setActiveLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActiveLiveSessions();
  }, [loadActiveLiveSessions]);

  function clearCreateMedia(): void {
    setCreateMedia((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });

    setCreateMediaProgress(0);
    setCreateMediaError(null);

    if (createMediaInputRef.current) {
      createMediaInputRef.current.value = '';
    }
  }

  function closeCreateVibe(): void {
    if (creatingVibe) {
      return;
    }

    setCreateVibeOpen(false);
    setCreateCaption('');
    clearCreateMedia();
  }

  function selectCreateMedia(file?: File): void {
    if (!file) {
      return;
    }

    const supportedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ]);

    if (!supportedTypes.has(file.type.toLowerCase())) {
      setCreateMediaError('Choose a JPEG, PNG, WebP, HEIC or HEIF image.');
      return;
    }

    if (file.size <= 0) {
      setCreateMediaError('The selected image is empty.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setCreateMediaError('Images must be smaller than 20 MB.');
      return;
    }

    setCreateMedia((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });

    setCreateMediaProgress(0);
    setCreateMediaError(null);
  }

  async function publishVibe(): Promise<void> {
    const caption = createCaption.trim();

    if ((!caption && !createMedia) || creatingVibe) {
      return;
    }

    try {
      setCreatingVibe(true);
      setCreateMediaError(null);

      let mediaIds: string[] | undefined;

      if (createMedia) {
        const uploaded = await uploadWebMedia(createMedia, (progress) => {
          setCreateMediaProgress(progress);
        });

        mediaIds = [uploaded.id];
      }

      const created = await createVibe({
        ...(caption ? { caption } : {}),
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        ...(mediaIds ? { mediaIds } : {}),
      });

      setItems((current) => [created, ...current]);
      setCreateCaption('');
      clearCreateMedia();
      setCreateVibeOpen(false);
    } catch (cause) {
      console.error('Unable to create Vibe', cause);

      setCreateMediaError(
        cause instanceof Error ? cause.message : 'Unable to post this Vibe right now.',
      );
    } finally {
      setCreatingVibe(false);
    }
  }

  const commentsVibe = items.find((item) => item.id === commentsVibeId) ?? null;

  return (
    <main className="vibes-page">
      <section className="vibes-hero">
        <div className="vibes-hero-glow vibes-hero-glow-one" />
        <div className="vibes-hero-glow vibes-hero-glow-two" />

        <div className="vibes-hero-copy">
          <span className="vibes-eyebrow">NEIGHBOUR™ VYBES</span>

          <h1>
            Your world.
            <span>Moving.</span>
          </h1>

          <p>Real moments, local stories and live experiences from people across Neighbour™.</p>

          <div className="vibes-hero-meta">
            <span>
              <i className="vibes-meta-dot" />
              REAL PEOPLE
            </span>
            <span>REAL MOMENTS</span>
            <span>RIGHT NOW</span>
          </div>
        </div>

        <div className="vibes-header-actions">
          <button
            className="vibes-create-button"

            type="button"

            onClick={() => setCreateVibeOpen(true)}
          >
            + Create Vibe
          </button>

          <button className="vibes-go-live" type="button" onClick={() => setLiveStudioOpen(true)}>
            <span />
            Go Live
          </button>

          <div className="vibes-mode-tabs">
            {(
              [
                ['FOR_YOU', 'For You'],
                ['FOLLOWING', 'Following'],
                ['NEARBY', 'Nearby'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={mode === value ? 'active' : ''}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="vibes-discovery-heading">
        <div>
          <span className="vibes-section-kicker">DISCOVER</span>
          <h2>What&apos;s happening now.</h2>
          <p>Your personalised stream of moments from across Neighbour™.</p>
        </div>

        <div className="vibes-discovery-status">
          <span className="vibes-discovery-pulse" />
          VYBES
        </div>
      </section>

      <section className="vibes-live-discovery">
        <header className="vibes-live-discovery-header">
          <div>
            <span>LIVE NOW</span>
            <strong>Neighbourhood Live</strong>
          </div>

          <button
            type="button"
            disabled={activeLiveLoading}
            onClick={() => void loadActiveLiveSessions()}
          >
            {activeLiveLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {activeLiveSessions.length > 0 ? (
          <div className="vibes-live-grid">
            {activeLiveSessions.map((session) => (
              <article className="vibes-live-card" key={session.id}>
                <div className="vibes-live-card-copy">
                  <span className="vibes-live-card-badge">
                    <i />
                    LIVE
                  </span>

                  <strong>{session.title || `${session.creator.displayName} is live`}</strong>

                  <p>{session.creator.displayName}</p>

                  <small>{formatNumber(session.viewerCount)} watching</small>
                </div>

                <button type="button" onClick={() => setSelectedLiveSession(session)}>
                  Watch Live
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="vibes-live-empty">
            <div className="vibes-live-empty-icon">
              <span />
            </div>

            <div>
              <strong>
                {activeLiveLoading ? 'Checking Live Vybes…' : 'The neighbourhood is quiet.'}
              </strong>

              <p>
                {activeLiveLoading
                  ? 'Looking for people broadcasting across Neighbour™.'
                  : 'When someone goes live, their broadcast will appear here instantly.'}
              </p>
            </div>

            {!activeLiveLoading ? (
              <button type="button" onClick={() => setLiveStudioOpen(true)}>
                Start a Live Vybe
              </button>
            ) : null}
          </div>
        )}
      </section>

      {loading ? (
        <section className="vibes-state">Opening Vibes…</section>
      ) : message ? (
        <section className="vibes-state">{message}</section>
      ) : items.length === 0 ? (
        <section className="vibes-state vibes-empty-state">
          <div className="vibes-empty-mark">N</div>

          <span className="vibes-empty-kicker">YOUR VYBES START HERE</span>

          <strong>Nothing here yet. Be the first.</strong>

          <span>
            Share a moment with Neighbour™ or switch discovery feeds to see what people are posting.
          </span>

          <div className="vibes-empty-actions">
            <button type="button" onClick={() => setCreateVibeOpen(true)}>
              + Create Vibe
            </button>

            <button className="secondary" type="button" onClick={() => setLiveStudioOpen(true)}>
              Go Live
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="vibes-grid">
            {items.map((vibe) => (
              <article className="vibe-card" key={vibe.id} onMouseEnter={() => markViewed(vibe)}>
                <div className="vibe-media-wrap">
                  <VibeMedia vibe={vibe} />

                  <div className="vibe-media-gradient" />

                  <div className="vibe-creator">
                    <div className="vibe-avatar">
                      {vibe.creator.avatarUrl ? (
                        <img src={vibe.creator.avatarUrl} alt="" />
                      ) : (
                        vibe.creator.displayName.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div>
                      <strong>{vibe.creator.displayName}</strong>
                      <span>
                        {vibe.postcode
                          ? vibe.postcode
                          : vibe.publishedAt
                            ? new Date(vibe.publishedAt).toLocaleDateString('en-GB')
                            : 'Neighbour™'}
                      </span>
                    </div>
                  </div>

                  <button
                    className={vibe.engagement.savedByMe ? 'vibe-save saved' : 'vibe-save'}
                    type="button"
                    onClick={() => void toggleSave(vibe)}
                  >
                    {vibe.engagement.savedByMe ? 'Saved' : 'Save'}
                  </button>
                </div>

                <div className="vibe-body">
                  {vibe.caption ? <p className="vibe-caption">{vibe.caption}</p> : null}

                  <div className="vibe-stats">
                    <span>{formatNumber(vibe.engagement.viewCount)} views</span>
                    <span>{formatNumber(vibe.engagement.commentCount)} comments</span>
                    <span>{formatNumber(vibe.engagement.reactionCount)} reactions</span>
                  </div>

                  <div className="vibe-actions">
                    <div className="vibe-reactions">
                      {reactionOptions.map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={vibe.engagement.myReaction === type ? 'selected' : ''}
                          onClick={() => void react(vibe, type)}
                          title={type}
                        >
                          {type === 'LIKE'
                            ? '👍'
                            : type === 'LOVE'
                              ? '❤️'
                              : type === 'FIRE'
                                ? '🔥'
                                : type === 'LAUGH'
                                  ? '😂'
                                  : '😮'}
                        </button>
                      ))}
                    </div>

                    <button
                      className="vibe-comment-button"
                      type="button"
                      onClick={() => setCommentsVibeId(vibe.id)}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {nextCursor ? (
            <div className="vibes-load-more">
              <button type="button" disabled={loadingMore} onClick={() => void load(nextCursor)}>
                {loadingMore ? 'Loading…' : 'Load more Vibes'}
              </button>
            </div>
          ) : null}
        </>
      )}
      {createVibeOpen ? (
        <div className="vibes-create-overlay">
          <section
            aria-label="Create Vibe"
            aria-modal="true"
            className="vibes-create-modal"
            role="dialog"
          >
            <header>
              <div>
                <span>NEW VIBE</span>
                <strong>Share with Neighbour™</strong>
              </div>

              <button
                type="button"
                disabled={creatingVibe}
                className="vibes-create-close"
                onClick={closeCreateVibe}
              >
                ×
              </button>
            </header>

            <textarea
              autoFocus
              maxLength={500}
              placeholder="What’s happening in your world?"
              value={createCaption}
              onChange={(event) => setCreateCaption(event.target.value)}
            />

            <div className="vibes-create-media">
              <input
                ref={createMediaInputRef}
                className="vibes-create-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                disabled={creatingVibe}
                onChange={(event) => selectCreateMedia(event.target.files?.[0])}
              />

              {createMedia ? (
                <div className="vibes-create-preview">
                  <img src={createMedia.previewUrl} alt="Selected Vibe preview" />

                  <div className="vibes-create-preview-actions">
                    <span>READY TO SHARE</span>

                    <div>
                      <button
                        type="button"
                        disabled={creatingVibe}
                        onClick={() => createMediaInputRef.current?.click()}
                      >
                        Replace
                      </button>

                      <button type="button" disabled={creatingVibe} onClick={clearCreateMedia}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="vibes-create-add-media"
                  type="button"
                  disabled={creatingVibe}
                  onClick={() => createMediaInputRef.current?.click()}
                >
                  <span className="vibes-create-add-icon">+</span>

                  <span>
                    <strong>Add a picture</strong>
                    <small>JPEG, PNG, WebP, HEIC or HEIF · Max 20 MB</small>
                  </span>
                </button>
              )}

              {createMediaError ? (
                <p className="vibes-create-media-error">{createMediaError}</p>
              ) : null}

              {creatingVibe && createMedia && createMediaProgress > 0 ? (
                <div className="vibes-create-progress">
                  <span style={{ width: `${Math.round(createMediaProgress * 100)}%` }} />
                </div>
              ) : null}
            </div>

            <footer>
              <span>{createCaption.length}/500</span>

              <button
                type="button"
                disabled={(!createCaption.trim() && !createMedia) || creatingVibe}
                onClick={() => void publishVibe()}
              >
                {creatingVibe ? 'Posting…' : 'Post Vibe'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      <WebLiveStudio
        open={liveStudioOpen}
        onClose={() => setLiveStudioOpen(false)}
        onLiveEnded={() => {
          void load();
        }}
      />

      <WebLiveViewer
        open={selectedLiveSession !== null}
        session={selectedLiveSession}
        onClose={() => {
          setSelectedLiveSession(null);
          void loadActiveLiveSessions();
        }}
      />

      {commentsVibe ? (
        <Comments
          vibe={commentsVibe}
          onClose={() => setCommentsVibeId(null)}
          onIncrement={() => {
            setItems((current) =>
              current.map((item) =>
                item.id === commentsVibe.id
                  ? {
                      ...item,
                      engagement: {
                        ...item.engagement,
                        commentCount: item.engagement.commentCount + 1,
                      },
                    }
                  : item,
              ),
            );
          }}
        />
      ) : null}

      <style>{`
        .vibes-page {
          --vybes-ink: #10231b;
          --vybes-muted: #718078;
          --vybes-green: #0e754d;
          --vybes-green-deep: #075637;
          --vybes-dark: #071a13;
          --vybes-border: #dce8e2;
          --vybes-soft: #f5faf7;
        }

        .vibes-hero {
          position: relative;
          min-height: 360px;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 44px;
          margin-bottom: 28px;
          padding: clamp(34px, 5vw, 64px);
          border-radius: 34px;
          background:
            radial-gradient(circle at 84% 10%, rgba(44, 181, 119, .28), transparent 29%),
            radial-gradient(circle at 8% 100%, rgba(34, 131, 88, .18), transparent 34%),
            linear-gradient(135deg, #06120d 0%, #0a2117 55%, #0b2c1e 100%);
          color: #fff;
          box-shadow: 0 26px 70px rgba(7, 35, 24, .18);
        }

        .vibes-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .14;
          background-image:
            linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(to right, transparent, #000);
        }

        .vibes-hero-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(1px);
          pointer-events: none;
        }

        .vibes-hero-glow-one {
          width: 290px;
          height: 290px;
          top: -145px;
          right: 12%;
          background: rgba(49, 207, 135, .16);
        }

        .vibes-hero-glow-two {
          width: 220px;
          height: 220px;
          right: -100px;
          bottom: -110px;
          background: rgba(255,255,255,.055);
        }

        .vibes-hero-copy {
          position: relative;
          z-index: 2;
          max-width: 720px;
        }

        .vibes-hero .vibes-eyebrow {
          margin-bottom: 14px;
          color: #69e4a8;
          font-size: 10px;
          letter-spacing: .23em;
        }

        .vibes-hero h1 {
          max-width: 680px;
          margin: 0;
          color: #fff;
          font-size: clamp(48px, 6.5vw, 86px);
          font-weight: 950;
          line-height: .9;
          letter-spacing: -.065em;
        }

        .vibes-hero h1 span {
          display: block;
          color: #66e0a4;
        }

        .vibes-hero-copy > p {
          max-width: 610px;
          margin: 24px 0 0;
          color: rgba(255,255,255,.7);
          font-size: 16px;
          line-height: 1.7;
        }

        .vibes-hero-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px 18px;
          margin-top: 28px;
          color: rgba(255,255,255,.55);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .14em;
        }

        .vibes-hero-meta span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .vibes-meta-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5be39b;
          box-shadow: 0 0 0 5px rgba(91,227,155,.1);
        }

        .vibes-hero .vibes-header-actions {
          position: relative;
          z-index: 2;
          width: min(100%, 390px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
          gap: 10px;
        }

        .vibes-hero .vibes-create-button,
        .vibes-hero .vibes-go-live {
          min-height: 54px;
          border-radius: 17px;
          font-size: 13px;
          font-weight: 900;
          transition:
            transform .18s ease,
            background .18s ease,
            border-color .18s ease;
        }

        .vibes-hero .vibes-create-button {
          border: 1px solid rgba(255,255,255,.16);
          background: #fff;
          color: #0a4e34;
          box-shadow: 0 12px 28px rgba(0,0,0,.14);
        }

        .vibes-hero .vibes-create-button:hover {
          transform: translateY(-2px);
          background: #f5fff9;
        }

        .vibes-hero .vibes-go-live {
          border: 1px solid rgba(255,91,91,.35);
          background: linear-gradient(135deg, #ff4e55, #e92f42);
          color: #fff;
          box-shadow: 0 12px 28px rgba(222,45,61,.22);
        }

        .vibes-hero .vibes-go-live:hover {
          transform: translateY(-2px);
        }

        .vibes-hero .vibes-mode-tabs {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          margin-top: 4px;
          padding: 5px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 17px;
          background: rgba(255,255,255,.07);
          backdrop-filter: blur(18px);
        }

        .vibes-hero .vibes-mode-tabs button {
          min-height: 40px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: rgba(255,255,255,.62);
          font-size: 11px;
          font-weight: 850;
        }

        .vibes-hero .vibes-mode-tabs button:hover {
          color: #fff;
          background: rgba(255,255,255,.07);
        }

        .vibes-hero .vibes-mode-tabs button.active {
          background: rgba(255,255,255,.14);
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
        }

        .vibes-discovery-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin: 36px 2px 16px;
        }

        .vibes-section-kicker {
          display: block;
          margin-bottom: 6px;
          color: var(--vybes-green);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .2em;
        }

        .vibes-discovery-heading h2 {
          margin: 0;
          color: var(--vybes-ink);
          font-size: clamp(24px, 2.5vw, 34px);
          line-height: 1.05;
          letter-spacing: -.04em;
        }

        .vibes-discovery-heading p {
          margin: 7px 0 0;
          color: var(--vybes-muted);
          font-size: 13px;
        }

        .vibes-discovery-status {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border: 1px solid var(--vybes-border);
          border-radius: 999px;
          background: #fff;
          color: #315245;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .14em;
        }

        .vibes-discovery-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #20a46d;
          box-shadow: 0 0 0 5px rgba(32,164,109,.09);
        }

        .vibes-live-discovery {
          overflow: hidden;
          margin-bottom: 30px;
          border: 1px solid var(--vybes-border);
          border-radius: 26px;
          background:
            radial-gradient(circle at 100% 0%, rgba(19,126,81,.08), transparent 30%),
            linear-gradient(145deg, #fff, #f8fbf9);
          box-shadow: 0 14px 40px rgba(15,50,35,.055);
        }

        .vibes-live-discovery-header {
          padding: 20px 22px;
          border-bottom: 1px solid #e7efeb;
        }

        .vibes-live-discovery-header > div > span {
          color: #e83e4d;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .18em;
        }

        .vibes-live-discovery-header > div > strong {
          margin-top: 3px;
          color: var(--vybes-ink);
          font-size: 18px;
          letter-spacing: -.02em;
        }

        .vibes-live-discovery-header > button {
          min-height: 36px;
          padding: 0 13px;
          border: 1px solid #dce7e1;
          border-radius: 11px;
          background: #fff;
          color: #3d5b4e;
          font-size: 10px;
          font-weight: 850;
        }

        .vibes-live-empty {
          min-height: 142px;
          display: grid;
          grid-template-columns: auto minmax(0,1fr) auto;
          align-items: center;
          gap: 18px;
          margin: 0;
          padding: 24px;
          color: inherit;
        }

        .vibes-live-empty-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: #fff0f1;
        }

        .vibes-live-empty-icon span {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #ef4655;
          box-shadow:
            0 0 0 6px rgba(239,70,85,.12),
            0 0 0 12px rgba(239,70,85,.055);
        }

        .vibes-live-empty strong {
          display: block;
          color: var(--vybes-ink);
          font-size: 15px;
        }

        .vibes-live-empty p {
          margin: 5px 0 0;
          color: var(--vybes-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .vibes-live-empty > button {
          min-height: 42px;
          padding: 0 16px;
          border: 0;
          border-radius: 13px;
          background: #10231b;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }

        .vibes-grid {
          gap: 20px;
        }

        .vibe-card {
          overflow: hidden;
          border: 1px solid #dfe9e4;
          border-radius: 26px;
          background: #fff;
          box-shadow: 0 14px 42px rgba(15,50,35,.07);
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease;
        }

        .vibe-card:hover {
          transform: translateY(-4px);
          border-color: #c9ddd2;
          box-shadow: 0 22px 54px rgba(15,50,35,.12);
        }

        .vibe-media-wrap {
          aspect-ratio: 4 / 5;
          background: var(--vybes-dark);
        }

        .vibe-media {
          transition: transform .4s ease;
        }

        .vibe-card:hover .vibe-media {
          transform: scale(1.018);
        }

        .vibe-media-gradient {
          background:
            linear-gradient(to bottom, rgba(0,0,0,.38), transparent 32%),
            linear-gradient(to top, rgba(0,0,0,.82), transparent 48%);
        }

        .vibe-avatar {
          border-color: rgba(255,255,255,.42);
          box-shadow: 0 5px 16px rgba(0,0,0,.16);
        }

        .vibe-save {
          backdrop-filter: blur(14px);
        }

        .vibe-body {
          padding: 17px 18px 18px;
        }

        .vibe-caption {
          color: #243a30;
          font-size: 13px;
          line-height: 1.55;
        }

        .vibe-stats {
          padding-top: 13px;
          border-top: 1px solid #eef3f0;
          color: #849188;
          font-size: 9px;
          font-weight: 800;
        }

        .vibe-actions {
          margin-top: 13px;
        }

        .vibe-reactions {
          gap: 5px;
        }

        .vibe-reactions button {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          transition:
            transform .15s ease,
            background .15s ease;
        }

        .vibe-reactions button:hover {
          transform: translateY(-2px);
        }

        .vibe-comment-button {
          min-height: 34px;
          border-radius: 11px;
          font-weight: 850;
        }

        .vibes-state {
          min-height: 300px;
          border: 1px solid var(--vybes-border);
          border-radius: 28px;
          background:
            radial-gradient(circle at 50% 0%, rgba(18,128,82,.08), transparent 34%),
            #fff;
          box-shadow: 0 16px 44px rgba(15,50,35,.055);
        }

        .vibes-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 54px 30px;
          text-align: center;
        }

        .vibes-empty-mark {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          margin-bottom: 8px;
          border-radius: 21px;
          background: linear-gradient(145deg, #0e754d, #075637);
          color: #fff;
          font-size: 23px;
          font-weight: 950;
          box-shadow: 0 12px 30px rgba(14,117,77,.22);
        }

        .vibes-empty-kicker {
          color: var(--vybes-green) !important;
          font-size: 9px !important;
          font-weight: 950 !important;
          letter-spacing: .18em;
        }

        .vibes-empty-state strong {
          color: var(--vybes-ink);
          font-size: 22px;
          letter-spacing: -.025em;
        }

        .vibes-empty-state > span:last-of-type {
          max-width: 520px;
          color: var(--vybes-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .vibes-empty-actions {
          display: flex;
          gap: 9px;
          margin-top: 12px;
        }

        .vibes-empty-actions button {
          min-height: 44px;
          padding: 0 18px;
          border: 0;
          border-radius: 13px;
          background: var(--vybes-green);
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }

        .vibes-empty-actions button.secondary {
          border: 1px solid #d9e5df;
          background: #fff;
          color: #23483a;
        }

        .vibes-load-more button {
          min-height: 46px;
          padding: 0 20px;
          border-radius: 14px;
          background: #10231b;
          color: #fff;
          font-weight: 850;
          box-shadow: 0 10px 26px rgba(16,35,27,.12);
        }

        .vibes-create-overlay {
          backdrop-filter: blur(9px);
          background: rgba(5,18,12,.58);
        }

        .vibes-create-modal {
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: 26px;
          box-shadow: 0 30px 90px rgba(0,0,0,.26);
        }

        .vibes-create-modal header {
          background:
            radial-gradient(circle at 100% 0%, rgba(39,159,105,.12), transparent 38%),
            #fff;
        }

        .vibes-create-modal header span {
          color: var(--vybes-green);
          letter-spacing: .17em;
        }

        .vibes-create-modal textarea {
          min-height: 180px;
          font-size: 15px;
          line-height: 1.6;
        }

        .vibes-create-modal header {
          position: relative;
          padding-right: 72px;
          background:
            radial-gradient(circle at 100% 0%, rgba(39,159,105,.18), transparent 38%),
            linear-gradient(135deg, #071a13, #0b2c1e);
        }

        .vibes-create-modal header span {
          color: #66e0a4;
        }

        .vibes-create-modal header strong {
          color: #fff;
        }

        .vibes-create-modal header .vibes-create-close {
          position: absolute;
          top: 50%;
          right: 20px;
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          transform: translateY(-50%);
          margin: 0;
          padding: 0;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 50%;
          background: rgba(255,255,255,.08);
          color: #fff;
          cursor: pointer;
          font-size: 25px;
          line-height: 1;
        }

        .vibes-create-modal header .vibes-create-close:hover {
          background: rgba(255,255,255,.15);
        }

        .vibes-create-file-input {
          display: none;
        }

        .vibes-create-media {
          margin: 0 0 18px;
        }

        .vibes-create-add-media {
          width: 100%;
          min-height: 92px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px dashed rgba(102,224,164,.36);
          border-radius: 17px;
          background: rgba(102,224,164,.055);
          color: #fff;
          cursor: pointer;
          text-align: left;
        }

        .vibes-create-add-media:hover {
          border-color: rgba(102,224,164,.68);
          background: rgba(102,224,164,.09);
        }

        .vibes-create-add-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #0e754d;
          color: #fff;
          font-size: 25px;
        }

        .vibes-create-add-media > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .vibes-create-add-media strong {
          font-size: 13px;
          font-weight: 900;
        }

        .vibes-create-add-media small {
          color: rgba(255,255,255,.5);
          font-size: 10px;
        }

        .vibes-create-preview {
          position: relative;
          overflow: hidden;
          min-height: 220px;
          max-height: 390px;
          border-radius: 18px;
          background: #050806;
        }

        .vibes-create-preview img {
          width: 100%;
          max-height: 390px;
          display: block;
          object-fit: contain;
        }

        .vibes-create-preview-actions {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 30px 14px 14px;
          background: linear-gradient(to top, rgba(0,0,0,.88), transparent);
        }

        .vibes-create-preview-actions > span {
          color: rgba(255,255,255,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .14em;
        }

        .vibes-create-preview-actions > div {
          display: flex;
          gap: 6px;
        }

        .vibes-create-preview-actions button {
          min-height: 34px;
          padding: 0 11px;
          border: 1px solid rgba(255,255,255,.17);
          border-radius: 10px;
          background: rgba(255,255,255,.11);
          color: #fff;
          cursor: pointer;
          font-size: 10px;
          font-weight: 850;
        }

        .vibes-create-media-error {
          margin: 9px 2px 0;
          color: #ff7d89;
          font-size: 11px;
        }

        .vibes-create-progress {
          overflow: hidden;
          height: 4px;
          margin-top: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
        }

        .vibes-create-progress span {
          height: 100%;
          display: block;
          border-radius: inherit;
          background: #66e0a4;
          transition: width .18s ease;
        }

        .vibes-comments {
          border-radius: 28px 0 0 28px;
          box-shadow: -20px 0 70px rgba(0,0,0,.16);
        }

        @media (max-width: 980px) {
          .vibes-hero {
            grid-template-columns: 1fr;
            align-items: end;
          }

          .vibes-hero .vibes-header-actions {
            width: 100%;
            max-width: 520px;
          }
        }

        @media (max-width: 680px) {
          .vibes-hero {
            min-height: 0;
            gap: 30px;
            padding: 30px 22px;
            border-radius: 25px;
          }

          .vibes-hero h1 {
            font-size: clamp(45px, 16vw, 68px);
          }

          .vibes-hero-copy > p {
            font-size: 14px;
          }

          .vibes-hero-meta {
            gap: 8px 13px;
          }

          .vibes-hero .vibes-header-actions {
            grid-template-columns: 1fr;
          }

          .vibes-hero .vibes-mode-tabs {
            grid-column: 1;
          }

          .vibes-discovery-heading {
            align-items: flex-start;
          }

          .vibes-discovery-status {
            display: none;
          }

          .vibes-live-empty {
            grid-template-columns: auto minmax(0,1fr);
          }

          .vibes-live-empty > button {
            grid-column: 1 / -1;
          }

          .vibes-empty-actions {
            width: 100%;
            flex-direction: column;
          }

          .vibes-empty-actions button {
            width: 100%;
          }
        }

        .vibes-page {
          width: min(100% - 48px, 1420px);
          margin: 0 auto;
          padding: 42px 0 84px;
          color: #10231b;
        }

        .vibes-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 32px;
        }

        .vibes-eyebrow {
          display: block;
          margin-bottom: 8px;
          color: #0e754d;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .vibes-header h1 {
          margin: 0;
          font-size: clamp(34px, 4vw, 58px);
          line-height: 1;
          letter-spacing: -.04em;
        }

        .vibes-header p {
          margin: 12px 0 0;
          color: #61726a;
          font-size: 15px;
        }

        .vibes-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vibes-create-button {
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          color: #fff;
          cursor: pointer;
          padding: 11px 18px;
          font: inherit;
          font-weight: 850;
        }

        .vibes-live-discovery {
          margin-bottom: 22px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.035);
          padding: 18px;
        }

        .vibes-live-discovery-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .vibes-live-discovery-header > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .vibes-live-discovery-header span {
          color: #ff536b;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .vibes-live-discovery-header button,
        .vibes-live-card > button {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          cursor: pointer;
          padding: 9px 14px;
          font: inherit;
          font-weight: 850;
        }

        .vibes-live-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 10px;
        }

        .vibes-live-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-radius: 17px;
          background: rgba(0, 0, 0, 0.22);
          padding: 14px;
        }

        .vibes-live-card-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .vibes-live-card-copy p {
          margin: 0;
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
        }

        .vibes-live-card-copy small,
        .vibes-live-empty {
          color: rgba(255, 255, 255, 0.48);
        }

        .vibes-live-card-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #ff536b;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .vibes-live-card-badge i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .vibes-create-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(14px);
        }

        .vibes-create-modal {
          width: min(560px, 100%);
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 24px;
          background: #101210;
          padding: 20px;
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.6);
        }

        .vibes-create-modal header,
        .vibes-create-modal footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .vibes-create-modal header > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .vibes-create-modal header span {
          color: rgba(255, 255, 255, 0.48);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .vibes-create-modal header button {
          border: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
          font-size: 28px;
        }

        .vibes-create-modal textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: 180px;
          margin: 20px 0 14px;
          resize: vertical;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 17px;
          outline: none;
          background: rgba(255, 255, 255, 0.045);
          color: #fff;
          padding: 16px;
          font: inherit;
        }

        .vibes-create-modal footer > span {
          color: rgba(255, 255, 255, 0.46);
          font-size: 12px;
        }

        .vibes-create-modal footer button {
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: #111;
          cursor: pointer;
          padding: 11px 18px;
          font: inherit;
          font-weight: 900;
        }

        .vibes-create-modal footer button:disabled,
        .vibes-live-discovery-header button:disabled {
          cursor: default;
          opacity: 0.5;
        }

        .vibes-go-live {
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 0;
          border-radius: 999px;
          background: #ef233c;
          padding: 0 18px;
          color: #fff;
          cursor: pointer;
          font-weight: 900;
          box-shadow: 0 10px 28px rgba(239,35,60,.19);
        }

        .vibes-go-live span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #fff;
        }

        .vibes-mode-tabs {
          display: flex;
          gap: 8px;
          padding: 5px;
          border: 1px solid #dce7e1;
          border-radius: 999px;
          background: #fff;
        }

        .vibes-mode-tabs button {
          border: 0;
          border-radius: 999px;
          background: transparent;
          padding: 10px 16px;
          color: #687971;
          cursor: pointer;
          font-weight: 800;
        }

        .vibes-mode-tabs button.active {
          background: #0e754d;
          color: #fff;
        }

        .vibes-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .vibe-card {
          overflow: hidden;
          border: 1px solid #e2eae6;
          border-radius: 26px;
          background: #fff;
          box-shadow: 0 18px 48px rgba(15, 50, 35, .08);
        }

        .vibe-media-wrap {
          position: relative;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #0a100d;
        }

        .vibe-media {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .vibe-media-empty {
          display: grid;
          place-items: center;
          align-content: center;
          gap: 12px;
          color: rgba(255,255,255,.75);
        }

        .vibe-media-mark {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: #0e754d;
          color: #fff;
          font-weight: 950;
          font-size: 22px;
        }

        .vibe-media-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 55%, rgba(0,0,0,.65));
          pointer-events: none;
        }

        .vibe-creator {
          position: absolute;
          left: 16px;
          right: 90px;
          bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }

        .vibe-creator > div:last-child {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .vibe-creator strong,
        .vibe-creator span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vibe-creator span {
          margin-top: 2px;
          color: rgba(255,255,255,.68);
          font-size: 12px;
        }

        .vibe-avatar {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 14px;
          background: #e8f5ed;
          color: #075637;
          font-weight: 900;
        }

        .vibe-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vibe-save {
          position: absolute;
          right: 14px;
          top: 14px;
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px;
          background: rgba(0,0,0,.38);
          backdrop-filter: blur(14px);
          padding: 8px 12px;
          color: #fff;
          cursor: pointer;
          font-weight: 800;
        }

        .vibe-save.saved {
          background: #0e754d;
        }

        .vibe-body {
          padding: 17px;
        }

        .vibe-caption {
          min-height: 42px;
          margin: 0 0 12px;
          color: #273c32;
          font-size: 14px;
          line-height: 1.5;
        }

        .vibe-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          color: #829087;
          font-size: 11px;
          font-weight: 750;
        }

        .vibe-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 15px;
        }

        .vibe-reactions {
          display: flex;
          gap: 4px;
        }

        .vibe-reactions button {
          width: 31px;
          height: 31px;
          border: 0;
          border-radius: 10px;
          background: #f3f7f5;
          cursor: pointer;
        }

        .vibe-reactions button.selected {
          outline: 2px solid #0e754d;
          background: #e8f5ed;
        }

        .vibe-comment-button {
          border: 0;
          border-radius: 11px;
          background: #10231b;
          padding: 8px 12px;
          color: #fff;
          cursor: pointer;
          font-weight: 800;
        }

        .vibes-state {
          min-height: 360px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          border: 1px dashed #d8e4de;
          border-radius: 28px;
          background: #fff;
          color: #77877f;
        }

        .vibes-state strong {
          color: #1b3428;
          font-size: 20px;
        }

        .vibes-load-more {
          display: flex;
          justify-content: center;
          padding-top: 32px;
        }

        .vibes-load-more button {
          border: 0;
          border-radius: 999px;
          background: #0e754d;
          padding: 13px 22px;
          color: #fff;
          cursor: pointer;
          font-weight: 850;
        }

        .vibes-comments-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          background: rgba(4,12,8,.46);
          backdrop-filter: blur(3px);
        }

        .vibes-comments {
          width: min(100%, 470px);
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #fff;
          box-shadow: -20px 0 70px rgba(0,0,0,.22);
        }

        .vibes-comments-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e7ece9;
        }

        .vibes-comments-header span {
          color: #0e754d;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .vibes-comments-header h2 {
          margin: 4px 0 0;
        }

        .vibes-comments-header button {
          border: 0;
          background: transparent;
          font-size: 30px;
          cursor: pointer;
        }

        .vibes-comments-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .vibes-comment {
          display: flex;
          gap: 11px;
          padding: 13px 0;
          border-bottom: 1px solid #eef2f0;
        }

        .vibes-comment-avatar {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #e8f5ed;
          color: #075637;
          font-size: 11px;
          font-weight: 900;
        }

        .vibes-comment p {
          margin: 4px 0 0;
          color: #4e6158;
          line-height: 1.45;
        }

        .vibes-comments-state {
          padding: 30px 0;
          color: #829087;
          text-align: center;
        }

        .vibes-comment-composer {
          display: flex;
          gap: 8px;
          padding: 18px;
          border-top: 1px solid #e7ece9;
        }

        .vibes-comment-composer input {
          flex: 1;
          min-width: 0;
          border: 1px solid #d8e4de;
          border-radius: 14px;
          padding: 12px 14px;
          outline: 0;
        }

        .vibes-comment-composer button {
          border: 0;
          border-radius: 14px;
          background: #0e754d;
          padding: 0 17px;
          color: #fff;
          font-weight: 850;
          cursor: pointer;
        }

        @media (max-width: 1050px) {
          .vibes-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .vibes-page {
            width: min(100% - 26px, 1420px);
            padding-top: 24px;
          }

          .vibes-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .vibes-header-actions {
            width: 100%;
            align-items: stretch;
            flex-direction: column;
          }

          .vibes-go-live {
            justify-content: center;
          }

          .vibes-mode-tabs {
            width: 100%;
          }

          .vibes-mode-tabs button {
            flex: 1;
          }

          .vibes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
