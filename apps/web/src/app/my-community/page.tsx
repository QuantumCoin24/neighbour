'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';

import {
  getMyCommunities,
  type CommunityMembership,
} from '@neighbour/api-client';

function formatRole(value: string) {
  return (
    value.charAt(0) +
    value.slice(1).toLowerCase()
  );
}

function formatCategory(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');
}

export default function MyCommunityPage() {
  const [communities, setCommunities] =
    useState<CommunityMembership[]>([]);

  const [message, setMessage] =
    useState('Loading your local communities...');

  useEffect(() => {
    const token =
      localStorage.getItem('accessToken');

    if (!token) {
      setMessage('Please sign in first.');
      return;
    }

    getMyCommunities(token)
      .then((items) => {
        setCommunities(items);
        setMessage('');
      })
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load your communities.',
        ),
      );
  }, []);

  const active = communities.filter(
    (item) => item.status === 'ACTIVE',
  );

  return (
    <main className="nearby-page">
      <header className="nearby-header">
        <div>
          <div className="nearby-eyebrow">
            YOUR LOCAL NETWORK
          </div>

          <h1>Nearby</h1>

          <p>
            Your communities, local memberships
            and places you’re connected to.
          </p>
        </div>

        <Link
          href="/community"
          className="nearby-discover"
        >
          + Discover communities
        </Link>
      </header>

      <section className="nearby-overview">
        <div className="nearby-overview-primary">
          <span>CONNECTED COMMUNITIES</span>
          <strong>{active.length}</strong>
          <p>
            {active.length === 1
              ? 'local community'
              : 'local communities'}
          </p>
        </div>

        <div className="nearby-overview-copy">
          <h2>Your neighbourhood network</h2>

          <p>
            Open a community to see local posts,
            events, members and conversations.
          </p>
        </div>

        <div className="nearby-status">
          <span />
          Neighbour™ connected
        </div>
      </section>

      {message ? (
        <div className="nearby-message">
          {message}
        </div>
      ) : null}

      {!message && active.length === 0 ? (
        <section className="nearby-empty">
          <div className="nearby-empty-icon">
            ⌖
          </div>

          <h2>
            Your local network starts here.
          </h2>

          <p>
            Discover a nearby community and connect
            with the people around you.
          </p>

          <Link href="/community">
            Find communities
          </Link>
        </section>
      ) : null}

      {active.length > 0 ? (
        <section className="nearby-content">
          <div className="nearby-section-title">
            <h2>Your communities</h2>

            <p>
              Communities where your membership is
              active.
            </p>
          </div>

          <div className="nearby-grid">
            {active.map((item) => {
              const community =
                item.community;

              const location = [
                community.city,
                community.postcode,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <article
                  key={item.id}
                  className="nearby-card"
                >
                  <div className="nearby-card-header">
                    <div className="nearby-pin">
                      ⌖
                    </div>

                    <div className="nearby-role">
                      {formatRole(item.role)}
                    </div>
                  </div>

                  <div className="nearby-category">
                    {formatCategory(
                      community.category,
                    )}
                  </div>

                  <h3>{community.name}</h3>

                  <p className="nearby-location">
                    {location ||
                      'Local community'}
                  </p>

                  <p className="nearby-description">
                    {community.shortDescription ||
                      community.description ||
                      'Your local Neighbour™ community.'}
                  </p>

                  <div className="nearby-card-stats">
                    <div>
                      <strong>
                        {community.memberCount}
                      </strong>
                      <span>Neighbours</span>
                    </div>

                    <div>
                      <strong>
                        {community.allowEvents
                          ? 'Yes'
                          : '—'}
                      </strong>
                      <span>Events</span>
                    </div>

                    <div>
                      <strong>
                        {item.status ===
                        'ACTIVE'
                          ? 'Live'
                          : item.status}
                      </strong>
                      <span>Status</span>
                    </div>
                  </div>

                  <Link
                    href={`/community/${community.slug}`}
                    className="nearby-open"
                  >
                    Open community →
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <style>{`
        .nearby-page {
          width: min(100% - 48px, 1420px);
          margin: 0 auto;
          padding: 42px 0 90px;
          box-sizing: border-box;
        }

        .nearby-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 26px;
        }

        .nearby-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .nearby-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(32px,4vw,48px);
          letter-spacing: -.045em;
        }

        .nearby-header p {
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
        }

        .nearby-discover {
          padding: 12px 17px;
          border-radius: 13px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
        }

        .nearby-overview {
          display: grid;
          grid-template-columns:
            190px minmax(0,1fr) auto;
          gap: 24px;
          align-items: center;
          padding: 24px;
          border-radius: 22px;
          background:
            linear-gradient(
              120deg,
              #0a1729,
              #122e4d
            );
          color: #fff;
        }

        .nearby-overview-primary span {
          display: block;
          color: #8edcb9;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .nearby-overview-primary strong {
          display: block;
          margin-top: 5px;
          font-size: 36px;
          line-height: 1;
        }

        .nearby-overview-primary p {
          margin: 4px 0 0;
          color: rgba(255,255,255,.62);
          font-size: 10px;
        }

        .nearby-overview-copy {
          padding-left: 24px;
          border-left:
            1px solid rgba(255,255,255,.12);
        }

        .nearby-overview-copy h2 {
          margin: 0;
          font-size: 18px;
        }

        .nearby-overview-copy p {
          margin: 6px 0 0;
          max-width: 520px;
          color: rgba(255,255,255,.67);
          font-size: 11px;
          line-height: 1.5;
        }

        .nearby-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.8);
          font-size: 10px;
          font-weight: 750;
        }

        .nearby-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #42d48b;
        }

        .nearby-message {
          margin-top: 18px;
          padding: 14px;
          border-radius: 13px;
          background: #fff3d9;
          color: #755719;
          font-size: 12px;
        }

        .nearby-content {
          margin-top: 30px;
        }

        .nearby-section-title h2 {
          margin: 0;
          color: #102019;
          font-size: 20px;
        }

        .nearby-section-title p {
          margin: 5px 0 0;
          color: #7a8781;
          font-size: 12px;
        }

        .nearby-grid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 18px;
          margin-top: 16px;
        }

        .nearby-card {
          padding: 20px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 12px 34px rgba(19,45,34,.04);
        }

        .nearby-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nearby-pin {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 17px;
        }

        .nearby-role {
          padding: 6px 9px;
          border-radius: 999px;
          background: #f2f5f3;
          color: #5c6d65;
          font-size: 9px;
          font-weight: 800;
        }

        .nearby-category {
          margin-top: 17px;
          color: #997426;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .11em;
          text-transform: uppercase;
        }

        .nearby-card h3 {
          margin: 7px 0 0;
          color: #102019;
          font-size: 20px;
          letter-spacing: -.025em;
        }

        .nearby-location {
          margin: 7px 0 0;
          color: #52665c;
          font-size: 10px;
          font-weight: 750;
        }

        .nearby-description {
          min-height: 48px;
          margin: 13px 0 0;
          color: #74817b;
          font-size: 11px;
          line-height: 1.5;
        }

        .nearby-card-stats {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 7px;
          margin-top: 16px;
        }

        .nearby-card-stats div {
          padding: 10px 8px;
          border-radius: 11px;
          background: #f7f9f8;
          text-align: center;
        }

        .nearby-card-stats strong {
          display: block;
          color: #086240;
          font-size: 13px;
        }

        .nearby-card-stats span {
          display: block;
          margin-top: 3px;
          color: #8a9690;
          font-size: 8px;
        }

        .nearby-open {
          margin-top: 17px;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .nearby-empty {
          margin-top: 28px;
          padding: 54px 24px;
          border: 1px dashed #d8e1dc;
          border-radius: 22px;
          background: rgba(255,255,255,.65);
          text-align: center;
        }

        .nearby-empty-icon {
          margin: auto;
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 22px;
        }

        .nearby-empty h2 {
          margin: 14px 0 0;
        }

        .nearby-empty p {
          margin: 8px auto 18px;
          max-width: 420px;
          color: #75827c;
          font-size: 12px;
        }

        .nearby-empty a {
          display: inline-flex;
          padding: 11px 15px;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        @media (max-width: 1100px) {
          .nearby-grid {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }
        }

        @media (max-width: 760px) {
          .nearby-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .nearby-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .nearby-overview {
            grid-template-columns: 1fr;
          }

          .nearby-overview-copy {
            padding-left: 0;
            padding-top: 16px;
            border-left: 0;
            border-top:
              1px solid rgba(255,255,255,.12);
          }

          .nearby-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
