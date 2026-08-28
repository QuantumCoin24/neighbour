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
            <div style={heroKicker}>BUY · SELL · GIVE · LOCAL</div>
            <h1 style={title}>Your neighbourhood marketplace.</h1>
            <p style={subtitle}>
              Buy useful things nearby, sell what you no longer need and give something a second
              life — all through people in your local community.
            </p>
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

      <section style={pathways}>
        <Link href="/marketplace/create" style={pathwayCard}>
          <span style={pathwayIcon}>＋</span>
          <span>
            <strong style={pathwayTitle}>Sell locally</strong>
            <span style={pathwayCopy}>Turn unused things into something useful.</span>
          </span>
          <span style={pathwayArrow}>→</span>
        </Link>

        <Link href="/marketplace/create" style={pathwayCard}>
          <span style={pathwayIcon}>♥</span>
          <span>
            <strong style={pathwayTitle}>Give it away</strong>
            <span style={pathwayCopy}>Pass something useful to a neighbour.</span>
          </span>
          <span style={pathwayArrow}>→</span>
        </Link>

        <div style={pathwayCard}>
          <span style={pathwayIcon}>⌕</span>
          <span>
            <strong style={pathwayTitle}>Discover nearby</strong>
            <span style={pathwayCopy}>Find useful things without going far.</span>
          </span>
          <span style={pathwayArrow}>↓</span>
        </div>
      </section>

      <section style={discoveryHeading}>
        <div>
          <div style={sectionEyebrow}>YOUR LOCAL MARKETPLACE</div>
          <h2 style={sectionTitle}>Find something nearby.</h2>
        </div>
        <div style={localBadge}>● LOCAL FIRST</div>
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
        <section style={emptyMarketplace}>
          <div style={emptyMark}>N</div>

          <div style={emptyEyebrow}>YOUR LOCAL MARKETPLACE STARTS HERE</div>

          <h2 style={emptyTitle}>
            {query.trim() || category || freeOnly ? 'Nothing matches just yet.' : 'Be the first.'}
          </h2>

          <p style={emptyCopy}>
            {query.trim() || category || freeOnly
              ? 'Try another search or change your filters to discover more nearby.'
              : 'Sell something you no longer need, give something away to a neighbour, and help build a marketplace made for your local community.'}
          </p>

          <div style={emptyActions}>
            <Link href="/marketplace/create" style={emptyPrimary}>
              ＋ Create first listing
            </Link>

            {query.trim() || category || freeOnly ? (
              <button
                type="button"
                style={emptySecondary}
                onClick={() => {
                  setQuery('');
                  setCategory(undefined);
                  setFreeOnly(false);
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div style={emptyPrinciples}>
            <div style={emptyPrinciple}>
              <strong>SELL</strong>
              <span>Make space. Make something back.</span>
            </div>

            <div style={emptyPrinciple}>
              <strong>GIVE</strong>
              <span>Keep useful things in circulation.</span>
            </div>

            <div style={emptyPrinciple}>
              <strong>DISCOVER</strong>
              <span>Find what you need closer to home.</span>
            </div>
          </div>

          <div style={emptySignature}>Stronger together. Local forever.™</div>
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

const heroKicker: React.CSSProperties = {
  marginBottom: 8,
  color: '#9af1c4',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '.16em',
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

const pathways: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 12,
  marginTop: 18,
};

const pathwayCard: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '44px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 13,
  minHeight: 88,
  padding: '16px 18px',
  border: '1px solid #dfe9e2',
  borderRadius: 20,
  background: '#ffffff',
  color: '#10261c',
  textDecoration: 'none',
  boxShadow: '0 12px 30px rgba(15, 55, 38, 0.045)',
};

const pathwayIcon: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 42,
  height: 42,
  borderRadius: 14,
  background: '#e9f7ef',
  color: '#08714a',
  fontWeight: 950,
};

const pathwayTitle: React.CSSProperties = {
  display: 'block',
  fontSize: 15,
  fontWeight: 900,
};

const pathwayCopy: React.CSSProperties = {
  display: 'block',
  marginTop: 3,
  color: '#6a7d72',
  fontSize: 12,
  lineHeight: 1.35,
};

const pathwayArrow: React.CSSProperties = {
  color: '#08714a',
  fontSize: 18,
  fontWeight: 900,
};

const discoveryHeading: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 20,
  marginTop: 34,
};

const sectionEyebrow: React.CSSProperties = {
  color: '#08714a',
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: '.16em',
};

const sectionTitle: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#10261c',
  fontSize: 28,
  lineHeight: 1.05,
};

const localBadge: React.CSSProperties = {
  color: '#08714a',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '.1em',
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

const emptyMarketplace: React.CSSProperties = {
  marginTop: 18,
  padding: '48px clamp(24px, 6vw, 76px) 28px',
  border: '1px solid #dce8e0',
  borderRadius: 30,
  background:
    'radial-gradient(circle at 85% 10%, rgba(35,165,105,.11), transparent 28%), linear-gradient(145deg,#ffffff,#f4f9f5)',
  textAlign: 'center',
  color: '#10261c',
  boxShadow: '0 22px 60px rgba(20,65,45,.055)',
};

const emptyMark: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 58,
  height: 58,
  margin: '0 auto 18px',
  borderRadius: 18,
  background: '#08714a',
  color: '#ffffff',
  fontSize: 24,
  fontWeight: 950,
  boxShadow: '0 12px 30px rgba(8,113,74,.2)',
};

const emptyEyebrow: React.CSSProperties = {
  color: '#08714a',
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: '.17em',
};

const emptyTitle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 'clamp(32px, 4vw, 48px)',
  lineHeight: 1,
  letterSpacing: '-.04em',
};

const emptyCopy: React.CSSProperties = {
  maxWidth: 650,
  margin: '14px auto 0',
  color: '#65796d',
  fontSize: 15,
  lineHeight: 1.6,
};

const emptyActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 24,
};

const emptyPrimary: React.CSSProperties = {
  padding: '13px 19px',
  borderRadius: 14,
  background: '#08714a',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 900,
};

const emptySecondary: React.CSSProperties = {
  padding: '13px 19px',
  border: '1px solid #cfddd4',
  borderRadius: 14,
  background: '#ffffff',
  color: '#28483a',
  cursor: 'pointer',
  fontWeight: 850,
};

const emptyPrinciples: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10,
  maxWidth: 820,
  margin: '34px auto 0',
};

const emptyPrinciple: React.CSSProperties = {
  display: 'grid',
  gap: 5,
  padding: 16,
  border: '1px solid #dce8e0',
  borderRadius: 16,
  background: 'rgba(255,255,255,.7)',
  textAlign: 'left',
  color: '#66796f',
  fontSize: 12,
};

const emptySignature: React.CSSProperties = {
  marginTop: 30,
  paddingTop: 20,
  borderTop: '1px solid #dce8e0',
  color: '#668074',
  fontSize: 11,
  fontWeight: 800,
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
