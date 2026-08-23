'use client';

import {
  searchMarketplaceListings,
  type MarketplaceListing,
  type MarketplaceListingCategory,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import MarketplaceListingCard from '../../components/marketplace/MarketplaceListingCard';
import { CATEGORIES, label } from '../../components/marketplace/marketplace-ui';

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceListingCategory | undefined>();
  const [freeOnly, setFreeOnly] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (cursor?: string) => {
      cursor ? setLoadingMore(true) : setLoading(true);
      setError('');

      try {
        const page = await searchMarketplaceListings({
          ...(query.trim() ? { query: query.trim() } : {}),
          ...(category ? { category } : {}),
          ...(freeOnly ? { freeOnly: true } : {}),
          limit: 24,
          ...(cursor ? { cursor } : {}),
        });

        setItems((current) => (cursor ? [...current, ...page.items] : page.items));
        setNextCursor(page.nextCursor);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Community listings could not be loaded.',
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, freeOnly, query],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query.trim() ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [load, query]);

  return (
    <main style={shell}>
      <section style={hero}>
        <div style={eyebrow}>Neighbour Marketplace™</div>

        <div style={heroRow}>
          <div>
            <h1 style={title}>Buy, sell & give locally.</h1>
            <p style={subtitle}>Discover useful things from people in your local community.</p>
          </div>

          <Link href="/marketplace/create" style={heroButton}>
            ＋ Create listing
          </Link>
        </div>

        <div style={quickLinks}>
          <Link href="/marketplace/saved" style={quickLink}>
            ♥ Saved
          </Link>

          <Link href="/marketplace/mine" style={quickLink}>
            My listings
          </Link>

          <Link href="/marketplace/offers" style={quickLink}>
            Offers
          </Link>

          <Link href="/marketplace/transactions" style={quickLink}>
            Transactions
          </Link>
        </div>
      </section>

      <section style={filters}>
        <input
          aria-label="Search marketplace"
          placeholder="Search Marketplace…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={search}
        />

        <select
          aria-label="Listing category"
          value={category ?? ''}
          onChange={(event) =>
            setCategory((event.target.value || undefined) as MarketplaceListingCategory | undefined)
          }
          style={select}
        >
          <option value="">All categories</option>

          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setFreeOnly((value) => !value)}
          style={{
            ...filterButton,
            ...(freeOnly
              ? {
                  background: '#08714a',
                  color: '#fff',
                }
              : {}),
          }}
        >
          Free only
        </button>
      </section>

      {error ? (
        <section style={messageCard}>
          <strong>Marketplace couldn't load.</strong>
          <p>{error}</p>
          <button onClick={() => void load()} type="button">
            Retry
          </button>
        </section>
      ) : null}

      {loading ? (
        <section style={messageCard}>Opening Marketplace…</section>
      ) : items.length === 0 ? (
        <section style={messageCard}>
          <strong>No listings found.</strong>
          <p>Try another search or be the first person to list something.</p>
        </section>
      ) : (
        <>
          <section style={grid}>
            {items.map((listing) => (
              <MarketplaceListingCard key={listing.id} listing={listing} />
            ))}
          </section>

          {nextCursor ? (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                disabled={loadingMore}
                onClick={() => void load(nextCursor)}
                type="button"
                style={primaryButton}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: '40px 40px 90px',
};

const hero: React.CSSProperties = {
  padding: 34,
  borderRadius: 30,
  background: 'linear-gradient(135deg,#061b13,#0a5f40)',
  color: '#fff',
};

const eyebrow: React.CSSProperties = {
  color: '#9af1c4',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
};

const heroRow: React.CSSProperties = {
  marginTop: 8,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  alignItems: 'flex-end',
  flexWrap: 'wrap',
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(34px,5vw,58px)',
  lineHeight: 1,
};

const subtitle: React.CSSProperties = {
  maxWidth: 680,
  margin: '14px 0 0',
  color: 'rgba(255,255,255,.75)',
  fontSize: 16,
};

const heroButton: React.CSSProperties = {
  padding: '13px 18px',
  borderRadius: 14,
  background: '#fff',
  color: '#075d3c',
  textDecoration: 'none',
  fontWeight: 900,
};

const quickLinks: React.CSSProperties = {
  display: 'flex',
  gap: 9,
  marginTop: 22,
};

const quickLink: React.CSSProperties = {
  padding: '9px 13px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,.17)',
  background: 'rgba(255,255,255,.08)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 750,
};

const filters: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px,1fr) 220px auto',
  gap: 10,
  marginTop: 22,
  padding: 14,
  border: '1px solid #e0e9e3',
  borderRadius: 20,
  background: '#fff',
};

const search: React.CSSProperties = {
  minWidth: 0,
  height: 46,
  boxSizing: 'border-box',
  padding: '0 14px',
  border: '1px solid #dbe6df',
  borderRadius: 13,
  fontSize: 15,
};

const select: React.CSSProperties = {
  height: 46,
  border: '1px solid #dbe6df',
  borderRadius: 13,
  background: '#fff',
  padding: '0 12px',
};

const filterButton: React.CSSProperties = {
  height: 46,
  padding: '0 18px',
  border: '1px solid #dbe6df',
  borderRadius: 13,
  background: '#f5f9f6',
  color: '#375246',
  cursor: 'pointer',
  fontWeight: 800,
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))',
  gap: 18,
  marginTop: 24,
};

const messageCard: React.CSSProperties = {
  marginTop: 24,
  padding: 30,
  border: '1px solid #e0e9e3',
  borderRadius: 22,
  background: '#fff',
  color: '#465c50',
};

const primaryButton: React.CSSProperties = {
  padding: '12px 20px',
  border: 0,
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
};
