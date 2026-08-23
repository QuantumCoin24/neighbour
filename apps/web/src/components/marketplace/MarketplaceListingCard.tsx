'use client';

import type { MarketplaceListing } from '@neighbour/api-client';
import Link from 'next/link';

import { label, priceLabel } from './marketplace-ui';

export default function MarketplaceListingCard({ listing }: { listing: MarketplaceListing }) {
  const image = listing.media[0]?.asset.url;

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      style={{
        display: 'block',
        overflow: 'hidden',
        border: '1px solid #dfe9e3',
        borderRadius: 22,
        background: '#fff',
        boxShadow: '0 12px 32px rgba(25,52,38,.06)',
        color: '#10251b',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          aspectRatio: '4 / 3',
          background: '#edf3ef',
          overflow: 'hidden',
        }}
      >
        {image ? (
          <img
            alt={listing.title}
            src={image}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              color: '#84938b',
              fontSize: 42,
            }}
          >
            ▣
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <strong
            style={{
              fontSize: 17,
              lineHeight: 1.25,
            }}
          >
            {listing.title}
          </strong>

          {listing.saved ? <span title="Saved">♥</span> : null}
        </div>

        <div
          style={{
            marginTop: 9,
            color: '#08714a',
            fontSize: 20,
            fontWeight: 900,
          }}
        >
          {priceLabel(listing.pricePence, listing.isFree)}
        </div>

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <span style={pill}>{label(listing.condition)}</span>
          <span style={pill}>{label(listing.category)}</span>
        </div>

        <div
          style={{
            marginTop: 12,
            color: '#718078',
            fontSize: 13,
          }}
        >
          {listing.localArea ||
            listing.seller.localArea ||
            listing.community?.name ||
            'Local marketplace'}
        </div>
      </div>
    </Link>
  );
}

const pill: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: 999,
  background: '#f0f6f2',
  color: '#4e6558',
  fontSize: 11,
  fontWeight: 750,
};
