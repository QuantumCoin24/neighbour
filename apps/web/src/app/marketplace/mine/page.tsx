'use client';

import {
  deleteMarketplaceListing,
  getMyMarketplaceListings,
  updateMarketplaceListing,
  type MarketplaceListing,
  type MarketplaceListingStatus,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { priceLabel, statusLabel } from '../../../components/marketplace/marketplace-ui';

export default function MyMarketplaceListingsPage() {
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      setItems(await getMyMarketplaceListings());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your listings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeStatus(listing: MarketplaceListing, status: MarketplaceListingStatus) {
    setWorkingId(listing.id);

    try {
      const updated = await updateMarketplaceListing(listing.id, { status });

      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Listing status could not be changed.');
    } finally {
      setWorkingId(null);
    }
  }

  async function remove(listing: MarketplaceListing) {
    if (!window.confirm(`Delete "${listing.title}" permanently?`)) {
      return;
    }

    setWorkingId(listing.id);

    try {
      await deleteMarketplaceListing(listing.id);

      setItems((current) => current.filter((item) => item.id !== listing.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Listing could not be deleted.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main style={shell}>
      <div style={top}>
        <div>
          <Link href="/marketplace" style={back}>
            ← Marketplace
          </Link>
          <h1>My listings</h1>
        </div>

        <Link href="/marketplace/create" style={create}>
          ＋ New listing
        </Link>
      </div>

      {error ? <p style={{ color: '#aa322d' }}>{error}</p> : null}

      {loading ? (
        <p>Loading your listings…</p>
      ) : items.length ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((listing) => {
            const image = listing.media[0]?.asset.url;
            const busy = workingId === listing.id;

            return (
              <article key={listing.id} style={row}>
                <Link href={`/marketplace/${listing.id}`} style={imageBox}>
                  {image ? (
                    <img
                      alt={listing.title}
                      src={image}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    '▣'
                  )}
                </Link>

                <div style={{ flex: 1 }}>
                  <Link href={`/marketplace/${listing.id}`} style={listingLink}>
                    {listing.title}
                  </Link>

                  <div style={price}>{priceLabel(listing.pricePence, listing.isFree)}</div>

                  <small>
                    {statusLabel(listing.status)} · {listing.viewCount} views
                  </small>
                </div>

                <div style={controls}>
                  {listing.status === 'DRAFT' || listing.status === 'ARCHIVED' ? (
                    <button
                      disabled={busy}
                      type="button"
                      onClick={() => void changeStatus(listing, 'PUBLISHED')}
                    >
                      Publish
                    </button>
                  ) : null}

                  {listing.status === 'PUBLISHED' ? (
                    <button
                      disabled={busy}
                      type="button"
                      onClick={() => void changeStatus(listing, 'ARCHIVED')}
                    >
                      Archive
                    </button>
                  ) : null}

                  <button
                    disabled={busy}
                    type="button"
                    onClick={() => void remove(listing)}
                    style={{ color: '#a63431' }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section style={empty}>
          <strong>No listings yet.</strong>
          <p>Create your first local Marketplace listing.</p>
        </section>
      )}
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: '40px 40px 90px',
};

const top: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 20,
  marginBottom: 25,
};

const back: React.CSSProperties = {
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 800,
};

const create: React.CSSProperties = {
  padding: '12px 17px',
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 850,
};

const row: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  padding: 13,
  border: '1px solid #e0e9e3',
  borderRadius: 18,
  background: '#fff',
};

const imageBox: React.CSSProperties = {
  width: 110,
  height: 90,
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: 12,
  background: '#eef3f0',
  color: '#819088',
  textDecoration: 'none',
};

const listingLink: React.CSSProperties = {
  color: '#10251b',
  textDecoration: 'none',
  fontSize: 17,
  fontWeight: 850,
};

const price: React.CSSProperties = {
  margin: '5px 0',
  color: '#08714a',
  fontWeight: 850,
};

const controls: React.CSSProperties = {
  display: 'flex',
  gap: 7,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const empty: React.CSSProperties = {
  padding: 30,
  border: '1px solid #e0e9e3',
  borderRadius: 20,
  background: '#fff',
};
