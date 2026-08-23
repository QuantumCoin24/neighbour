'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getDiscoverOffers } from '@neighbour/api-client';

type OfferResult = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  business?: {
    id?: string | null;
    name?: string | null;
    category?: string | null;
  } | null;
  businessName?: string | null;
};

const shell: React.CSSProperties = {
  maxWidth: '1180px',
  margin: '0 auto',
  padding: '44px 42px 80px',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(9,46,32,.09)',
  borderRadius: 24,
  boxShadow: '0 18px 45px rgba(31,46,38,.06)',
};

function businessName(offer: OfferResult) {
  return offer.business?.name || offer.businessName || 'Neighbour™ local business';
}

export default function OfferDiscoverPage() {
  const [offers, setOffers] = useState<OfferResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const data = await getDiscoverOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setOffers([]);
      setError(err instanceof Error ? err.message : 'Unable to load local offers right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeOffers = useMemo(
    () =>
      offers.filter(
        (offer) => !offer.status || offer.status === 'ACTIVE' || offer.status === 'PUBLISHED',
      ),
    [offers],
  );

  return (
    <main style={shell}>
      <section
        style={{
          borderRadius: 30,
          padding: '36px 38px',
          color: '#fff',
          background: 'linear-gradient(135deg, #071426 0%, #113452 100%)',
          boxShadow: '0 22px 55px rgba(7,20,38,.12)',
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
          Local business offers
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 26,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            marginTop: 10,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(36px,4vw,56px)',
                lineHeight: 1,
              }}
            >
              Offers near you
            </h1>

            <p
              style={{
                margin: '15px 0 0',
                color: 'rgba(255,255,255,.74)',
                fontSize: 17,
                lineHeight: 1.55,
              }}
            >
              Discover offers published by businesses connected to Neighbour™ communities.
            </p>
          </div>

          <div
            style={{
              minWidth: 145,
              padding: '17px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.12)',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 850 }}>{activeOffers.length}</div>
            <div style={{ color: 'rgba(255,255,255,.68)' }}>
              {activeOffers.length === 1 ? 'offer' : 'offers'}
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          marginTop: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
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
            Discover locally
          </div>

          <h2 style={{ margin: '6px 0 0', fontSize: 30 }}>Current offers</h2>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/business/discover"
            style={{
              padding: '11px 15px',
              borderRadius: 13,
              background: '#fff',
              border: '1px solid rgba(9,46,32,.11)',
              color: '#123226',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Discover businesses
          </Link>

          <Link
            href="/business"
            style={{
              padding: '11px 15px',
              borderRadius: 13,
              background: '#08754b',
              color: '#fff',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Business Centre
          </Link>
        </div>
      </div>

      <section style={{ marginTop: 18 }}>
        {loading ? (
          <div
            style={{
              ...card,
              minHeight: 300,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              padding: 34,
            }}
          >
            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  margin: '0 auto 14px',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#eaf6ef',
                  color: '#08754b',
                  fontWeight: 900,
                }}
              >
                N
              </div>

              <strong style={{ fontSize: 18 }}>Loading local offers…</strong>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              ...card,
              padding: 28,
              borderColor: '#e8c6c3',
              background: '#fff8f7',
            }}
          >
            <div
              style={{
                color: '#a1372f',
                fontWeight: 850,
                marginBottom: 7,
              }}
            >
              Offers unavailable
            </div>

            <p
              style={{
                margin: 0,
                color: '#6d5957',
                lineHeight: 1.55,
              }}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={load}
              style={{
                marginTop: 16,
                border: 0,
                borderRadius: 13,
                padding: '11px 16px',
                background: '#08754b',
                color: '#fff',
                fontWeight: 850,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error && activeOffers.length === 0 ? (
          <div
            style={{
              ...card,
              minHeight: 360,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              padding: 38,
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 23,
                  margin: '0 auto 18px',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#edf7f1',
                  color: '#08754b',
                  fontSize: 28,
                }}
              >
                ◇
              </div>

              <h2 style={{ margin: 0, fontSize: 31 }}>No local offers yet</h2>

              <p
                style={{
                  margin: '11px auto 0',
                  color: '#68756e',
                  fontSize: 17,
                  lineHeight: 1.65,
                }}
              >
                There are currently no active business offers to show. New offers from connected
                local businesses will appear here automatically.
              </p>

              <Link
                href="/business/discover"
                style={{
                  display: 'inline-block',
                  marginTop: 22,
                  padding: '12px 17px',
                  borderRadius: 14,
                  background: '#08754b',
                  color: '#fff',
                  fontWeight: 850,
                  textDecoration: 'none',
                }}
              >
                Discover local businesses
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && !error && activeOffers.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 18,
            }}
          >
            {activeOffers.map((offer) => (
              <article
                key={offer.id}
                style={{
                  ...card,
                  padding: 25,
                  display: 'flex',
                  minHeight: 250,
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '7px 10px',
                      background: '#fff5de',
                      color: '#9b6b10',
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    Local offer
                  </span>

                  <span
                    style={{
                      color: '#08754b',
                      fontWeight: 850,
                      fontSize: 12,
                    }}
                  >
                    ● Active
                  </span>
                </div>

                <h3
                  style={{
                    margin: '18px 0 7px',
                    fontSize: 24,
                  }}
                >
                  {offer.title || 'Neighbour™ offer'}
                </h3>

                <div
                  style={{
                    color: '#08754b',
                    fontWeight: 800,
                    marginBottom: 11,
                  }}
                >
                  {businessName(offer)}
                </div>

                {offer.description ? (
                  <p
                    style={{
                      margin: 0,
                      color: '#647169',
                      lineHeight: 1.65,
                    }}
                  >
                    {offer.description}
                  </p>
                ) : null}

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 20,
                    borderTop: '1px solid #edf1ee',
                    color: '#77847d',
                    fontSize: 13,
                  }}
                >
                  {offer.endsAt
                    ? `Available until ${new Date(offer.endsAt).toLocaleDateString()}`
                    : 'Available through Neighbour™'}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
