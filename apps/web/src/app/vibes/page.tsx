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

  async function publishVibe(): Promise<void> {
    const caption = createCaption.trim();

    if (!caption || creatingVibe) {
      return;
    }

    try {
      setCreatingVibe(true);

      const created = await createVibe({
        caption,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      });

      setItems((current) => [created, ...current]);
      setCreateCaption('');
      setCreateVibeOpen(false);
    } catch (cause) {
      console.error('Unable to create Vibe', cause);
    } finally {
      setCreatingVibe(false);
    }
  }

  const commentsVibe = items.find((item) => item.id === commentsVibeId) ?? null;

  return (
    <main className="vibes-page">
      <header className="vibes-header">
        <div>
          <span className="vibes-eyebrow">NEIGHBOUR™ VIBES</span>
          <h1>What’s happening now.</h1>
          <p>Watch real moments, updates and stories from people around you.</p>
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
      </header>

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
          <p className="vibes-live-empty">
            {activeLiveLoading ? 'Checking for Live Vibes…' : 'No one is live right now.'}
          </p>
        )}
      </section>

      {loading ? (
        <section className="vibes-state">Opening Vibes…</section>
      ) : message ? (
        <section className="vibes-state">{message}</section>
      ) : items.length === 0 ? (
        <section className="vibes-state">
          <strong>No Vibes yet.</strong>
          <span>New moments will appear here as your community shares them.</span>
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
                onClick={() => setCreateVibeOpen(false)}
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

            <footer>
              <span>{createCaption.length}/500</span>

              <button
                type="button"
                disabled={!createCaption.trim() || creatingVibe}
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
