'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import {
  getCommunity,
  getMyCommunities,
  type Community,
  type CommunityMembership,
} from '@neighbour/api-client';

import CommunityTabs from '../../../../components/community/CommunityTabs';

const pageShell: React.CSSProperties = {
  maxWidth: '1160px',
  margin: '0 auto',
  padding: '44px 42px 80px',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(9, 46, 32, 0.09)',
  borderRadius: '26px',
  boxShadow: '0 18px 45px rgba(31, 46, 38, 0.06)',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function MembersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('No active session found.');
      setLoading(false);
      return;
    }

    try {
      const [communityResult, memberships] = await Promise.all([
        getCommunity(token, slug),
        getMyCommunities(token),
      ]);

      setCommunity(communityResult);

      const ownMembership =
        memberships.find(
          (item) =>
            item.community.id === communityResult.id ||
            item.community.slug === communityResult.slug,
        ) ?? null;

      setMembership(ownMembership);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load community members.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  const location = useMemo(() => {
    if (!community) return '';

    return [community.city, community.postcode].filter(Boolean).join(' · ');
  }, [community]);

  if (loading) {
    return (
      <main style={pageShell}>
        <p style={{ fontSize: 18 }}>Loading community members…</p>
      </main>
    );
  }

  if (!community) {
    return (
      <main style={pageShell}>
        <div style={{ ...card, padding: 32 }}>
          <h1 style={{ marginTop: 0 }}>Community members</h1>
          <p>{error || 'Community could not be loaded.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageShell}>
      <section
        style={{
          borderRadius: 30,
          padding: '34px 36px',
          marginBottom: 24,
          color: '#fff',
          background:
            'linear-gradient(135deg, #071426 0%, #102d4a 100%)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#8ee8bf',
            marginBottom: 10,
          }}
        >
          Community network
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(34px, 4vw, 54px)',
                lineHeight: 1,
              }}
            >
              Members
            </h1>

            <p
              style={{
                margin: '12px 0 0',
                color: 'rgba(255,255,255,.75)',
                fontSize: 17,
              }}
            >
              People connected through {community.name}.
            </p>
          </div>

          <div
            style={{
              minWidth: 150,
              padding: '17px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.12)',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 850 }}>
              {community.memberCount}
            </div>
            <div style={{ color: 'rgba(255,255,255,.68)' }}>
              {community.memberCount === 1 ? 'neighbour' : 'neighbours'}
            </div>
          </div>
        </div>
      </section>

      <CommunityTabs slug={slug} />

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, .8fr)',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div style={{ ...card, padding: 28 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              alignItems: 'center',
              marginBottom: 26,
            }}
          >
            <div>
              <div
                style={{
                  color: '#08754b',
                  fontSize: 12,
                  fontWeight: 850,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                }}
              >
                Your membership
              </div>

              <h2 style={{ margin: '7px 0 4px', fontSize: 29 }}>
                {community.name}
              </h2>

              <div style={{ color: '#6c7972' }}>
                {location || 'Local community'}
              </div>
            </div>

            <span
              style={{
                borderRadius: 999,
                padding: '8px 12px',
                background: '#eaf6ef',
                color: '#08754b',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {membership ? '✓ Connected' : 'Community'}
            </span>
          </div>

          {membership ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: 20,
                borderRadius: 22,
                background: '#f5f8f6',
                border: '1px solid #edf1ee',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#06764b',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: 20,
                }}
              >
                {initials(membership.role) || 'N'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 850, fontSize: 18 }}>
                  Your community membership
                </div>

                <div style={{ marginTop: 4, color: '#6b7771' }}>
                  Role: {membership.role.toLowerCase()}
                </div>
              </div>

              <div
                style={{
                  fontWeight: 850,
                  color:
                    membership.status === 'ACTIVE' ? '#08754b' : '#7d6215',
                }}
              >
                {membership.status}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: 20,
                borderRadius: 22,
                background: '#f7f7f5',
                color: '#56635d',
              }}
            >
              Membership record is not available for this account.
            </div>
          )}
        </div>

        <aside style={{ ...card, padding: 24 }}>
          <div
            style={{
              color: '#08754b',
              fontSize: 12,
              fontWeight: 850,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
            }}
          >
            Member directory
          </div>

          <h3 style={{ margin: '8px 0 8px', fontSize: 22 }}>
            Built for privacy
          </h3>

          <p
            style={{
              margin: 0,
              color: '#68756e',
              lineHeight: 1.6,
            }}
          >
            Neighbour™ currently exposes the community total and your own
            membership state. A public member-directory API is not currently
            exposed, so this page will not invent or display unverified member
            identities.
          </p>

          <Link
            href={`/community/${slug}`}
            style={{
              display: 'inline-block',
              marginTop: 20,
              color: '#08754b',
              fontWeight: 850,
              textDecoration: 'none',
            }}
          >
            ← Back to community
          </Link>
        </aside>
      </section>
    </main>
  );
}
