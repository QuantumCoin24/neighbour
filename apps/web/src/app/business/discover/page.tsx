'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { searchBusinesses } from '@neighbour/api-client';

type BusinessResult = {
  id: string;
  name?: string | null;
  category?: string | null;
  description?: string | null;
  verificationStatus?: string | null;
  status?: string | null;
  city?: string | null;
  postcode?: string | null;
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

function initials(name?: string | null) {
  if (!name) return 'B';

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatLabel(value?: string | null) {
  if (!value) return '';

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function BusinessDiscoverPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setResults([]);
      setSearched(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await searchBusinesses(cleanQuery);
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err) {
      setResults([]);
      setSearched(true);
      setError(err instanceof Error ? err.message : 'Unable to search businesses right now.');
    } finally {
      setLoading(false);
    }
  }

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
          Neighbour™ local business
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
              Discover local businesses
            </h1>

            <p
              style={{
                margin: '15px 0 0',
                color: 'rgba(255,255,255,.74)',
                fontSize: 17,
                lineHeight: 1.55,
              }}
            >
              Find businesses already connected to the Neighbour™ community.
            </p>
          </div>

          <Link
            href="/business"
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.14)',
              color: '#fff',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Business Centre
          </Link>
        </div>
      </section>

      <form
        onSubmit={runSearch}
        style={{
          ...card,
          marginTop: 22,
          padding: 18,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            flex: '0 0 auto',
            borderRadius: 15,
            display: 'grid',
            placeItems: 'center',
            background: '#eaf6ef',
            color: '#08754b',
            fontSize: 21,
          }}
        >
          ⌕
        </div>

        <input
          aria-label="Search local businesses"
          placeholder="Search by business name, category or local service"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            height: 48,
            border: 0,
            outline: 0,
            background: 'transparent',
            color: '#10251b',
            fontSize: 16,
          }}
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            minWidth: 120,
            height: 48,
            padding: '0 18px',
            borderRadius: 14,
            border: 0,
            background: loading || !query.trim() ? '#98b9a8' : '#08754b',
            color: '#fff',
            fontWeight: 850,
            cursor: loading || !query.trim() ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      <section style={{ marginTop: 30 }}>
        {!searched && !loading ? (
          <div
            style={{
              ...card,
              minHeight: 320,
              padding: 36,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  margin: '0 auto 18px',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#edf7f1',
                  color: '#08754b',
                  fontSize: 28,
                }}
              >
                ⌕
              </div>

              <h2 style={{ margin: 0, fontSize: 30 }}>Find businesses nearby</h2>

              <p
                style={{
                  margin: '10px 0 0',
                  color: '#68756e',
                  fontSize: 17,
                  lineHeight: 1.6,
                }}
              >
                Search Neighbour™ for local businesses, services and organisations connected to your
                community.
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              ...card,
              padding: 26,
              borderColor: '#e8c6c3',
              background: '#fff8f7',
            }}
          >
            <div
              style={{
                color: '#a1372f',
                fontWeight: 850,
                marginBottom: 6,
              }}
            >
              Search unavailable
            </div>

            <div style={{ color: '#6d5957' }}>{error}</div>
          </div>
        ) : null}

        {searched && !loading && !error && results.length === 0 ? (
          <div
            style={{
              ...card,
              minHeight: 280,
              padding: 34,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>No businesses found</h2>

              <p
                style={{
                  margin: '10px auto 0',
                  maxWidth: 520,
                  color: '#68756e',
                  lineHeight: 1.6,
                }}
              >
                No connected business matched “{query.trim()}”. Try a broader name, category or
                service.
              </p>
            </div>
          </div>
        ) : null}

        {results.length > 0 ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                gap: 20,
                marginBottom: 16,
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
                  Search results
                </div>

                <h2 style={{ margin: '6px 0 0', fontSize: 30 }}>Businesses found</h2>
              </div>

              <div style={{ color: '#6e7c74', fontWeight: 700 }}>
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 18,
              }}
            >
              {results.map((business) => {
                const location = [business.city, business.postcode].filter(Boolean).join(' · ');

                const verified = business.verificationStatus === 'APPROVED';

                return (
                  <article
                    key={business.id}
                    style={{
                      ...card,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 250,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 14,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 17,
                          display: 'grid',
                          placeItems: 'center',
                          background: '#08754b',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: 18,
                        }}
                      >
                        {initials(business.name)}
                      </div>

                      {verified ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '7px 10px',
                            background: '#eaf6ef',
                            color: '#08754b',
                            fontSize: 12,
                            fontWeight: 850,
                          }}
                        >
                          ✓ Verified
                        </span>
                      ) : null}
                    </div>

                    <h3
                      style={{
                        margin: '18px 0 6px',
                        fontSize: 23,
                      }}
                    >
                      {business.name || 'Local business'}
                    </h3>

                    {business.category ? (
                      <div
                        style={{
                          color: '#9b6b10',
                          fontWeight: 800,
                          fontSize: 13,
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                        }}
                      >
                        {formatLabel(business.category)}
                      </div>
                    ) : null}

                    {business.description ? (
                      <p
                        style={{
                          margin: '13px 0 0',
                          color: '#647169',
                          lineHeight: 1.6,
                        }}
                      >
                        {business.description}
                      </p>
                    ) : null}

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: 20,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        alignItems: 'center',
                        color: '#6c7972',
                        fontSize: 13,
                      }}
                    >
                      <span>{location || 'Neighbour™ business'}</span>

                      {business.status ? (
                        <strong style={{ color: '#08754b' }}>{formatLabel(business.status)}</strong>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
