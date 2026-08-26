'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  getCommunities,
  getMyCommunities,
  joinCommunity,
  type Community,
} from '@neighbour/api-client';

function formatCategory(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);

  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Loading communities...');

  const [joining, setJoining] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');

    setToken(storedToken);

    async function load() {
      try {
        const all = await getCommunities({
          limit: 100,
        });

        setCommunities(all);

        if (storedToken) {
          try {
            const mine = await getMyCommunities(storedToken);

            setJoinedIds(
              new Set(
                mine.filter((item) => item.status === 'ACTIVE').map((item) => item.community.id),
              ),
            );
          } catch {
            // Community discovery remains usable
            // even if membership lookup fails.
          }
        }

        setMessage('');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load communities.');
      }
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return communities;
    }

    return communities.filter((community) => {
      const haystack = [
        community.name,
        community.shortDescription,
        community.description,
        community.city,
        community.postcode,
        community.category,
        ...community.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [communities, query]);

  async function handleJoin(community: Community) {
    if (!token) {
      setMessage('Please sign in before joining a community.');
      return;
    }

    if (joinedIds.has(community.id)) {
      return;
    }

    setJoining(community.id);
    setMessage('');

    try {
      await joinCommunity(token, community.slug);

      setJoinedIds((current) => new Set([...current, community.id]));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to join community.');
    } finally {
      setJoining(null);
    }
  }

  return (
    <main className="communities-page">
      <header className="communities-header">
        <div>
          <div className="communities-eyebrow">DISCOVER LOCAL</div>

          <h1>Communities</h1>

          <p>Find the people, places and conversations that make your local area feel connected.</p>
        </div>

        <div className="communities-header-actions">
          <Link href="/community/create" className="communities-create-button">
            Create community
          </Link>

          <Link href="/my-community" className="communities-my-button">
            My communities
          </Link>
        </div>
      </header>

      <section className="communities-search-panel">
        <div className="communities-search-icon">⌕</div>

        <div>
          <label htmlFor="community-search">Find a community</label>

          <input
            id="community-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by area, name, postcode or interest"
          />
        </div>

        <div className="communities-count">
          <strong>{filtered.length}</strong>
          <span>{filtered.length === 1 ? 'community' : 'communities'}</span>
        </div>
      </section>

      {message ? <div className="communities-message">{message}</div> : null}

      <section className="communities-section">
        <div className="communities-section-heading">
          <div>
            <h2>Explore communities</h2>
            <p>Local spaces you can discover and join.</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="communities-empty">
            <div>⌖</div>

            <h3>No communities found</h3>

            <p>Try another area, postcode or search term.</p>
          </div>
        ) : (
          <div className="communities-grid">
            {filtered.map((community) => {
              const joined = joinedIds.has(community.id);

              const location = [community.city, community.postcode].filter(Boolean).join(' · ');

              return (
                <article key={community.id} className="community-card">
                  <div className="community-card-top">
                    {community.logoUrl ? (
                      <img src={community.logoUrl} alt="" className="community-logo" />
                    ) : (
                      <div className="community-logo community-logo-fallback">
                        {initials(community.name) || 'N'}
                      </div>
                    )}

                    <div className="community-card-status">
                      {joined ? '✓ Joined' : community.joinPolicy === 'OPEN' ? 'Open' : 'Request'}
                    </div>
                  </div>

                  <div className="community-category">{formatCategory(community.category)}</div>

                  <h3>{community.name}</h3>

                  <div className="community-location">
                    <span>⌖</span>
                    {location || 'Local community'}
                  </div>

                  <p className="community-description">
                    {community.shortDescription ||
                      community.description ||
                      'A local Neighbour™ community.'}
                  </p>

                  <div className="community-meta">
                    <span>
                      👥 {community.memberCount}{' '}
                      {community.memberCount === 1 ? 'neighbour' : 'neighbours'}
                    </span>

                    <span>{community.allowEvents ? '📅 Events' : '🏘 Local'}</span>
                  </div>

                  <div className="community-actions">
                    {joined ? (
                      <Link href={`/community/${community.slug}`} className="community-primary">
                        Open community
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="community-primary"
                        disabled={joining === community.id}
                        onClick={() => void handleJoin(community)}
                      >
                        {joining === community.id
                          ? 'Joining…'
                          : community.joinPolicy === 'OPEN'
                            ? 'Join community'
                            : 'Request to join'}
                      </button>
                    )}

                    <Link href={`/community/${community.slug}`} className="community-secondary">
                      View
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        .communities-page {
          width: min(100% - 48px, 1420px);
          margin: 0 auto;
          padding: 42px 0 90px;
          box-sizing: border-box;
        }

        .communities-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 26px;
        }

        .communities-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .communities-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(32px, 4vw, 48px);
          letter-spacing: -.045em;
        }

        .communities-header p {
          max-width: 650px;
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
          line-height: 1.55;
        }

        .communities-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .communities-create-button {
          padding: 12px 17px;
          border: 1px solid #0a6945;
          border-radius: 13px;
          background: #0a6945;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 850;
        }

        .communities-my-button {
          padding: 12px 17px;
          border: 1px solid #dce4df;
          border-radius: 13px;
          background: #fff;
          color: #20362d;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }

        .communities-search-panel {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
          padding: 18px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 12px 34px rgba(19,45,34,.045);
        }

        .communities-search-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 20px;
        }

        .communities-search-panel label {
          display: block;
          margin-bottom: 5px;
          color: #405249;
          font-size: 10px;
          font-weight: 800;
        }

        .communities-search-panel input {
          width: 100%;
          box-sizing: border-box;
          padding: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #102019;
          font: inherit;
          font-size: 14px;
        }

        .communities-search-panel input::placeholder {
          color: #a0aaa5;
        }

        .communities-count {
          min-width: 82px;
          padding-left: 18px;
          border-left: 1px solid #edf1ee;
          text-align: center;
        }

        .communities-count strong {
          display: block;
          color: #086240;
          font-size: 18px;
        }

        .communities-count span {
          display: block;
          margin-top: 2px;
          color: #8a9690;
          font-size: 9px;
        }

        .communities-message {
          margin-top: 16px;
          padding: 13px 15px;
          border-radius: 13px;
          background: #fff3d9;
          color: #74551b;
          font-size: 12px;
        }

        .communities-section {
          margin-top: 30px;
        }

        .communities-section-heading h2 {
          margin: 0;
          color: #102019;
          font-size: 20px;
          letter-spacing: -.025em;
        }

        .communities-section-heading p {
          margin: 5px 0 0;
          color: #7a8781;
          font-size: 12px;
        }

        .communities-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 16px;
        }

        .community-card {
          min-width: 0;
          padding: 20px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 12px 34px rgba(19,45,34,.04);
        }

        .community-card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .community-logo {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          object-fit: cover;
        }

        .community-logo-fallback {
          display: grid;
          place-items: center;
          background:
            linear-gradient(
              145deg,
              #0a714b,
              #06452f
            );
          color: #fff;
          font-size: 15px;
          font-weight: 850;
        }

        .community-card-status {
          padding: 6px 9px;
          border-radius: 999px;
          background: #eef6f2;
          color: #08704a;
          font-size: 9px;
          font-weight: 800;
        }

        .community-category {
          margin-top: 18px;
          color: #9a792b;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .community-card h3 {
          margin: 7px 0 0;
          color: #102019;
          font-size: 19px;
          letter-spacing: -.025em;
        }

        .community-location {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          color: #607069;
          font-size: 11px;
          font-weight: 700;
        }

        .community-description {
          min-height: 48px;
          margin: 13px 0 0;
          color: #718079;
          font-size: 11px;
          line-height: 1.5;
        }

        .community-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 16px;
        }

        .community-meta span {
          padding: 6px 8px;
          border-radius: 9px;
          background: #f6f8f7;
          color: #52635b;
          font-size: 9px;
          font-weight: 750;
        }

        .community-actions {
          display: flex;
          gap: 8px;
          margin-top: 18px;
        }

        .community-primary,
        .community-secondary {
          min-height: 38px;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          text-decoration: none;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .community-primary {
          flex: 1;
          border: 0;
          background: #086240;
          color: #fff;
        }

        .community-primary:disabled {
          opacity: .6;
          cursor: wait;
        }

        .community-secondary {
          padding: 0 13px;
          border: 1px solid #dce4df;
          background: #fff;
          color: #30453b;
        }

        .communities-empty {
          margin-top: 16px;
          padding: 44px;
          border: 1px dashed #d8e1dc;
          border-radius: 20px;
          text-align: center;
          background: rgba(255,255,255,.55);
        }

        .communities-empty > div {
          font-size: 28px;
        }

        .communities-empty h3 {
          margin: 10px 0 0;
        }

        .communities-empty p {
          color: #77847e;
          font-size: 12px;
        }

        @media (max-width: 1100px) {
          .communities-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .communities-page {
            width: min(100% - 28px, 680px);
            padding-top: 24px;
          }

          .communities-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .communities-grid {
            grid-template-columns: 1fr;
          }

          .communities-search-panel {
            grid-template-columns: auto 1fr;
          }

          .communities-count {
            grid-column: 1 / -1;
            padding: 10px 0 0;
            border-left: 0;
            border-top: 1px solid #edf1ee;
          }
        }
      `}</style>
    </main>
  );
}
