'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getVibesFeed, recordVibeView, type Vibe } from '@neighbour/api-client';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return 'N';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function VibePreviewMedia({ vibe }: { vibe: Vibe }) {
  const media = vibe.media[0];

  if (!media?.publicUrl) {
    return (
      <div className="home-vybe-media home-vybe-media-empty">
        <div className="home-vybe-mark">N</div>
        <span>Neighbour™ Vibe</span>
      </div>
    );
  }

  if (media.mimeType.startsWith('video/')) {
    return (
      <video
        className="home-vybe-media"
        muted
        playsInline
        preload="metadata"
        src={media.publicUrl}
      />
    );
  }

  return (
    <img className="home-vybe-media" src={media.publicUrl} alt={vibe.caption ?? 'Neighbour Vibe'} />
  );
}

export default function HomeVybesRail() {
  const [items, setItems] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const viewedRef = useRef(new Set<string>());

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(false);

      const response = await getVibesFeed({
        mode: 'FOR_YOU',
        limit: 8,
      });

      setItems(response.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function markViewed(vibe: Vibe): void {
    if (viewedRef.current.has(vibe.id)) {
      return;
    }

    viewedRef.current.add(vibe.id);

    void recordVibeView(vibe.id, {
      sessionKey: `home-web-${Date.now()}-${vibe.id}`,
      watchTimeMs: 1000,
      replay: false,
    }).catch(() => undefined);
  }

  if (!loading && (error || items.length === 0)) {
    return null;
  }

  return (
    <section className="home-vybes" aria-label="Neighbour Vibes">
      <header className="home-vybes-heading">
        <div>
          <span className="home-vybes-kicker">VYBES</span>
          <h2>See what&apos;s happening now.</h2>
          <p>Real moments and stories from across Neighbour™.</p>
        </div>

        <Link href="/vibes">
          Explore Vybes
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      {loading ? (
        <div className="home-vybes-loading" aria-label="Loading Vybes">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="home-vybe-skeleton" key={index} />
          ))}
        </div>
      ) : (
        <div className="home-vybes-rail">
          {items.map((vibe) => (
            <Link
              className="home-vybe-card"
              href="/vibes"
              key={vibe.id}
              onMouseEnter={() => markViewed(vibe)}
              onFocus={() => markViewed(vibe)}
            >
              <div className="home-vybe-media-wrap">
                <VibePreviewMedia vibe={vibe} />

                <div className="home-vybe-gradient" />

                <div className="home-vybe-topline">
                  <span className="home-vybe-badge">VYBE</span>

                  <span className="home-vybe-views">
                    {formatNumber(vibe.engagement.viewCount)} views
                  </span>
                </div>

                <div className="home-vybe-identity">
                  <div className="home-vybe-avatar">
                    {vibe.creator.avatarUrl ? (
                      <img src={vibe.creator.avatarUrl} alt="" />
                    ) : (
                      getInitials(vibe.creator.displayName)
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
              </div>

              {vibe.caption ? (
                <p className="home-vybe-caption">{vibe.caption}</p>
              ) : (
                <p className="home-vybe-caption home-vybe-caption-muted">Open this Vibe</p>
              )}

              <div className="home-vybe-engagement">
                <span>♡ {formatNumber(vibe.engagement.reactionCount)}</span>
                <span>◯ {formatNumber(vibe.engagement.commentCount)}</span>
              </div>
            </Link>
          ))}

          <Link className="home-vybes-more" href="/vibes">
            <div className="home-vybes-more-mark">N</div>
            <strong>More Vybes</strong>
            <span>Explore what&apos;s happening →</span>
          </Link>
        </div>
      )}

      <style>{`
        .home-vybes {
          min-width: 0;
          margin-top: 28px;
        }

        .home-vybes-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 15px;
        }

        .home-vybes-heading > div {
          min-width: 0;
        }

        .home-vybes-kicker {
          display: block;
          margin-bottom: 5px;
          color: #0e754d;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .19em;
        }

        .home-vybes-heading h2 {
          margin: 0;
          color: #10231b;
          font-size: clamp(22px, 2.2vw, 30px);
          line-height: 1.08;
          letter-spacing: -.035em;
        }

        .home-vybes-heading p {
          margin: 6px 0 0;
          color: #718078;
          font-size: 13px;
        }

        .home-vybes-heading > a {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #174c39;
          text-decoration: none;
          font-size: 13px;
          font-weight: 850;
        }

        .home-vybes-heading > a:hover {
          color: #0e754d;
        }

        .home-vybes-rail,
        .home-vybes-loading {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 2px 2px 13px;
          scroll-snap-type: x proximity;
          scrollbar-width: thin;
          scrollbar-color: #c6d7cf transparent;
          overscroll-behavior-inline: contain;
        }

        .home-vybe-card,
        .home-vybe-skeleton,
        .home-vybes-more {
          width: 205px;
          flex: 0 0 205px;
          scroll-snap-align: start;
        }

        .home-vybe-card {
          overflow: hidden;
          border: 1px solid #e0e9e4;
          border-radius: 22px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 12px 34px rgba(15, 50, 35, .07);
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            border-color .18s ease;
        }

        .home-vybe-card:hover {
          transform: translateY(-3px);
          border-color: #c8ddd2;
          box-shadow: 0 18px 42px rgba(15, 50, 35, .11);
        }

        .home-vybe-media-wrap {
          position: relative;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #08120d;
        }

        .home-vybe-media {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform .35s ease;
        }

        .home-vybe-card:hover .home-vybe-media {
          transform: scale(1.025);
        }

        .home-vybe-media-empty {
          display: grid;
          place-items: center;
          align-content: center;
          gap: 10px;
          color: rgba(255,255,255,.72);
          background:
            radial-gradient(circle at 20% 10%, rgba(33, 139, 92, .45), transparent 38%),
            linear-gradient(145deg, #0b2117, #06100b);
        }

        .home-vybe-mark,
        .home-vybes-more-mark {
          display: grid;
          place-items: center;
          background: #0e754d;
          color: #fff;
          font-weight: 950;
        }

        .home-vybe-mark {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          font-size: 20px;
        }

        .home-vybe-media-empty > span {
          font-size: 11px;
          font-weight: 800;
        }

        .home-vybe-gradient {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(to bottom, rgba(0,0,0,.28), transparent 34%),
            linear-gradient(to top, rgba(0,0,0,.78), transparent 48%);
        }

        .home-vybe-topline {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .home-vybe-badge {
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 999px;
          padding: 5px 8px;
          color: #fff;
          background: rgba(5,15,10,.4);
          backdrop-filter: blur(10px);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .14em;
        }

        .home-vybe-views {
          color: rgba(255,255,255,.82);
          font-size: 9px;
          font-weight: 800;
          text-shadow: 0 1px 8px rgba(0,0,0,.5);
        }

        .home-vybe-identity {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #fff;
        }

        .home-vybe-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 11px;
          background: #e8f5ed;
          color: #075637;
          font-size: 11px;
          font-weight: 950;
        }

        .home-vybe-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .home-vybe-identity > div:last-child {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .home-vybe-identity strong,
        .home-vybe-identity span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .home-vybe-identity strong {
          font-size: 11px;
        }

        .home-vybe-identity span {
          margin-top: 2px;
          color: rgba(255,255,255,.68);
          font-size: 9px;
        }

        .home-vybe-caption {
          min-height: 52px;
          margin: 0;
          padding: 12px 13px 4px;
          display: -webkit-box;
          overflow: hidden;
          color: #273c32;
          font-size: 11px;
          font-weight: 650;
          line-height: 1.45;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .home-vybe-caption-muted {
          color: #8a9891;
        }

        .home-vybe-engagement {
          display: flex;
          gap: 12px;
          padding: 8px 13px 12px;
          color: #7d8d85;
          font-size: 9px;
          font-weight: 800;
        }

        .home-vybes-more {
          min-height: 330px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #dce8e2;
          border-radius: 22px;
          background:
            radial-gradient(circle at top, rgba(31, 145, 95, .13), transparent 46%),
            #f8fbf9;
          color: #173d2e;
          text-align: center;
          text-decoration: none;
        }

        .home-vybes-more-mark {
          width: 46px;
          height: 46px;
          margin-bottom: 4px;
          border-radius: 15px;
        }

        .home-vybes-more strong {
          font-size: 15px;
        }

        .home-vybes-more span {
          max-width: 145px;
          color: #708078;
          font-size: 10px;
          line-height: 1.45;
        }

        .home-vybe-skeleton {
          aspect-ratio: .64;
          border-radius: 22px;
          background:
            linear-gradient(
              110deg,
              #eef4f1 8%,
              #f8fbf9 18%,
              #eef4f1 33%
            );
          background-size: 200% 100%;
          animation: home-vybes-loading 1.3s linear infinite;
        }

        @keyframes home-vybes-loading {
          to {
            background-position-x: -200%;
          }
        }

        @media (max-width: 720px) {
          .home-vybes {
            margin-top: 22px;
          }

          .home-vybes-heading {
            align-items: flex-start;
          }

          .home-vybes-heading p {
            display: none;
          }

          .home-vybes-heading > a {
            padding-top: 5px;
          }

          .home-vybe-card,
          .home-vybe-skeleton,
          .home-vybes-more {
            width: 178px;
            flex-basis: 178px;
          }

          .home-vybes-more {
            min-height: 294px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-vybe-card,
          .home-vybe-media {
            transition: none;
          }

          .home-vybe-skeleton {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
