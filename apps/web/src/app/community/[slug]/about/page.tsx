'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { getCommunity, type Community } from '@neighbour/api-client';

import CommunityTabs from '../../../../components/community/CommunityTabs';

const shell: React.CSSProperties = {
  maxWidth: '1160px',
  margin: '0 auto',
  padding: '44px 42px 80px',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(9,46,32,.09)',
  borderRadius: 26,
  boxShadow: '0 18px 45px rgba(31,46,38,.06)',
};

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not specified';

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function AboutPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
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
      setCommunity(await getCommunity(token, slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load community.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  const location = useMemo(() => {
    if (!community) return '';

    return [community.addressLine1, community.addressLine2, community.city, community.postcode]
      .filter(Boolean)
      .join(', ');
  }, [community]);

  if (loading) {
    return <main style={shell}>Loading community information…</main>;
  }

  if (!community) {
    return (
      <main style={shell}>
        <div style={{ ...card, padding: 30 }}>
          <h1>About this community</h1>
          <p>{error || 'Community could not be loaded.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main style={shell}>
      <section
        style={{
          borderRadius: 30,
          padding: '34px 36px',
          marginBottom: 24,
          color: '#fff',
          background: 'linear-gradient(135deg, #071426 0%, #102d4a 100%)',
        }}
      >
        <div
          style={{
            color: '#8ee8bf',
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
          }}
        >
          About your community
        </div>

        <h1
          style={{
            margin: '10px 0 0',
            fontSize: 'clamp(34px,4vw,54px)',
            lineHeight: 1,
          }}
        >
          {community.name}
        </h1>

        <p
          style={{
            margin: '14px 0 0',
            color: 'rgba(255,255,255,.75)',
            fontSize: 17,
            maxWidth: 760,
          }}
        >
          {community.shortDescription ||
            community.description ||
            'A Neighbour™ community built around local connection.'}
        </p>
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
        <div style={{ display: 'grid', gap: 22 }}>
          <article style={{ ...card, padding: 30 }}>
            <div
              style={{
                color: '#08754b',
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
              }}
            >
              Community
            </div>

            <h2 style={{ margin: '8px 0 12px', fontSize: 29 }}>About {community.name}</h2>

            <p
              style={{
                margin: 0,
                color: '#5f6c66',
                lineHeight: 1.75,
                fontSize: 16,
              }}
            >
              {community.description ||
                community.shortDescription ||
                'No extended community description has been added yet.'}
            </p>
          </article>

          {community.welcomeMessage ? (
            <article style={{ ...card, padding: 30 }}>
              <div
                style={{
                  color: '#b77f13',
                  fontSize: 12,
                  fontWeight: 850,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                }}
              >
                Welcome
              </div>

              <h2 style={{ margin: '8px 0 12px', fontSize: 27 }}>A message to neighbours</h2>

              <p
                style={{
                  margin: 0,
                  color: '#5f6c66',
                  lineHeight: 1.75,
                }}
              >
                {community.welcomeMessage}
              </p>
            </article>
          ) : null}

          <article style={{ ...card, padding: 30 }}>
            <div
              style={{
                color: '#08754b',
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
              }}
            >
              Community rules
            </div>

            <h2 style={{ margin: '8px 0 16px', fontSize: 27 }}>Local standards</h2>

            {community.rules.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {community.rules.map((rule, index) => (
                  <div
                    key={`${rule}-${index}`}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: '#f5f8f6',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: '#08754b' }}>{index + 1}.</strong> {rule}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7771', marginBottom: 0 }}>
                No additional community rules have been published yet.
              </p>
            )}
          </article>
        </div>

        <aside style={{ display: 'grid', gap: 18 }}>
          <section style={{ ...card, padding: 24 }}>
            <div
              style={{
                color: '#08754b',
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
              }}
            >
              Community snapshot
            </div>

            <h3 style={{ margin: '8px 0 18px', fontSize: 23 }}>At a glance</h3>

            <div style={{ display: 'grid', gap: 13 }}>
              <div>
                <small style={{ color: '#819087' }}>Members</small>
                <div style={{ fontWeight: 850, fontSize: 18 }}>{community.memberCount}</div>
              </div>

              <div>
                <small style={{ color: '#819087' }}>Category</small>
                <div style={{ fontWeight: 800 }}>{formatLabel(community.category)}</div>
              </div>

              <div>
                <small style={{ color: '#819087' }}>Visibility</small>
                <div style={{ fontWeight: 800 }}>{formatLabel(community.visibility)}</div>
              </div>

              <div>
                <small style={{ color: '#819087' }}>Join policy</small>
                <div style={{ fontWeight: 800 }}>{formatLabel(community.joinPolicy)}</div>
              </div>

              <div>
                <small style={{ color: '#819087' }}>Location</small>
                <div style={{ fontWeight: 800 }}>{location || 'Local area'}</div>
              </div>
            </div>
          </section>

          <section style={{ ...card, padding: 24 }}>
            <div
              style={{
                color: '#08754b',
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
              }}
            >
              Community features
            </div>

            <h3 style={{ margin: '8px 0 16px', fontSize: 23 }}>What’s enabled</h3>

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['Member posts', community.allowMemberPosts],
                ['Events', community.allowEvents],
                ['Businesses', community.allowBusinesses],
                ['Marketplace', community.allowMarketplace],
                ['Discovery', community.discoverable],
              ].map(([label, enabled]) => (
                <div
                  key={String(label)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: '11px 0',
                    borderBottom: '1px solid #edf1ee',
                  }}
                >
                  <span>{String(label)}</span>
                  <strong
                    style={{
                      color: enabled ? '#08754b' : '#8b9891',
                    }}
                  >
                    {enabled ? 'Enabled' : 'Off'}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <Link
            href={`/community/${slug}`}
            style={{
              textAlign: 'center',
              padding: '14px 16px',
              borderRadius: 16,
              background: '#08754b',
              color: '#fff',
              fontWeight: 850,
              textDecoration: 'none',
            }}
          >
            Back to community
          </Link>
        </aside>
      </section>
    </main>
  );
}
