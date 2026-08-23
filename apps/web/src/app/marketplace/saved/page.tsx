'use client';

import {
  getSavedMarketplaceListings,
  type MarketplaceListing,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import MarketplaceListingCard from '../../../components/marketplace/MarketplaceListingCard';

export default function SavedMarketplaceListingsPage() {
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      setItems(await getSavedMarketplaceListings());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Saved listings could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main style={shell}>
      <Link href="/marketplace" style={back}>
        ← Marketplace
      </Link>

      <h1>Saved listings</h1>
      <p style={{ color: '#718078' }}>
        Things you've bookmarked for later.
      </p>

      {error ? <p>{error}</p> : null}

      {loading ? (
        <p>Loading saved listings…</p>
      ) : items.length ? (
        <section style={grid}>
          {items.map((item) => (
            <MarketplaceListingCard
              key={item.id}
              listing={item}
            />
          ))}
        </section>
      ) : (
        <section style={empty}>
          You haven't saved any Marketplace listings yet.
        </section>
      )}
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '40px 40px 90px',
};

const back: React.CSSProperties = {
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 800,
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))',
  gap: 18,
  marginTop: 25,
};

const empty: React.CSSProperties = {
  marginTop: 24,
  padding: 30,
  borderRadius: 20,
  background: '#fff',
  border: '1px solid #e0e8e3',
};
