'use client';

import {
  getCurrentUser,
  getMarketplaceListing,
  purchaseMarketplaceListing,
  toggleMarketplaceListingSaved,
  type MarketplaceListing,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { label, priceLabel } from '../../../components/marketplace/marketplace-ui';

export default function MarketplaceListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function load() {
    try {
      setError('');
      setListing(await getMarketplaceListing(params.id));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Marketplace listing could not be loaded.',
      );
    }
  }

  useEffect(() => {
    void load();

    let active = true;

    void getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUserId(currentUser.id);
        }
      })
      .catch(() => {
        if (active) {
          setUserId(null);
        }
      })
      .finally(() => {
        if (active) {
          setIdentityLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  async function toggleSaved() {
    if (!listing || saving) return;

    setSaving(true);

    try {
      const result = await toggleMarketplaceListingSaved(listing.id);

      setListing({
        ...listing,
        saved: result.saved,
        savedCount: result.savedCount,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Saved state could not be changed.');
    } finally {
      setSaving(false);
    }
  }

  async function purchaseNow() {
    if (
      !listing ||
      purchasing ||
      !identityLoaded ||
      userId === null ||
      listing.seller.id === userId ||
      listing.status !== 'PUBLISHED' ||
      listing.isFree ||
      listing.pricePence === null
    ) {
      return;
    }

    setPurchasing(true);
    setError('');

    try {
      const transaction = await purchaseMarketplaceListing(listing.id);
      router.push(`/marketplace/transactions/${transaction.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'This listing could not be purchased.',
      );
    } finally {
      setPurchasing(false);
    }
  }

  if (error && !listing) {
    return <main style={shell}>{error}</main>;
  }

  if (!listing) {
    return <main style={shell}>Opening listing…</main>;
  }

  const isSeller = identityLoaded && userId !== null && listing.seller.id === userId;

  return (
    <main style={shell}>
      <Link href="/marketplace" style={back}>
        ← Marketplace
      </Link>

      <div style={layout}>
        <section>
          <div style={mainImage}>
            {listing.media[0]?.asset.url ? (
              <img
                alt={listing.title}
                src={listing.media[0].asset.url}
                onClick={() => setSelectedImage(listing.media[0].asset.url)}
                style={image}
              />
            ) : (
              <div style={emptyImage}>No photo</div>
            )}
          </div>

          {listing.media.length > 1 ? (
            <div style={thumbs}>
              {listing.media.map((item) =>
                item.asset.url ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedImage(item.asset.url)}
                    style={thumbButton}
                  >
                    <img
                      alt={item.altText ?? listing.title}
                      src={item.asset.url}
                      style={thumbImage}
                    />
                  </button>
                ) : null,
              )}
            </div>
          ) : null}
        </section>

        <aside>
          <div style={eyebrow}>Neighbour Marketplace™</div>

          <h1 style={heading}>{listing.title}</h1>

          <div style={price}>{priceLabel(listing.pricePence, listing.isFree)}</div>

          <div style={tags}>
            <span style={pill}>{label(listing.category)}</span>
            <span style={pill}>{label(listing.condition)}</span>
            <span style={pill}>{label(listing.status)}</span>
          </div>

          <p style={description}>{listing.description}</p>

          <section style={info}>
            <strong>Seller</strong>
            <div>{listing.seller.displayName}</div>
            <small>{listing.localArea || listing.seller.localArea || 'Local neighbour'}</small>
          </section>

          <section style={info}>
            <strong>Getting it to you</strong>
            <div style={{ marginTop: 7 }}>
              {listing.collectionAvailable ? '✓ Collection  ' : ''}
              {listing.deliveryAvailable ? '✓ Delivery  ' : ''}
              {listing.postageAvailable ? '✓ Postage' : ''}
            </div>
          </section>

          {identityLoaded && isSeller ? (
            <div style={notice}>
              <strong>This is your listing.</strong>

              <div style={{ marginTop: 7 }}>
                Buyer actions are hidden while you are viewing your own listing.
              </div>

              <div style={{ marginTop: 10 }}>
                <Link
                  href="/marketplace/mine"
                  style={{
                    display: 'inline-block',
                    padding: '10px 14px',
                    borderRadius: 999,
                    background: '#08714a',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 850,
                  }}
                >
                  Manage my listings
                </Link>
              </div>
            </div>
          ) : identityLoaded ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => void toggleSaved()}
                style={saveButton}
              >
                {listing.saved ? '♥ Saved' : '♡ Save listing'}
              </button>

              {listing.status === 'PUBLISHED' &&
              !listing.isFree &&
              listing.pricePence !== null ? (
                <div style={notice}>
                  <strong>Buy now</strong>

                  <div style={{ marginTop: 6 }}>
                    Reserve this item at the seller&apos;s asking price and continue to payment.
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      disabled={purchasing}
                      onClick={() => void purchaseNow()}
                      style={{
                        display: 'inline-block',
                        padding: '10px 14px',
                        border: 0,
                        borderRadius: 999,
                        background: '#08714a',
                        color: '#fff',
                        cursor: purchasing ? 'wait' : 'pointer',
                        fontWeight: 850,
                      }}
                    >
                      {purchasing
                        ? 'Reserving…'
                        : `Buy now — ${priceLabel(listing.pricePence, false)}`}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          <div style={meta}>
            {listing.viewCount} views · {listing.savedCount} saves
          </div>

          {error ? <p style={errorStyle}>{error}</p> : null}
        </aside>
      </div>

      {selectedImage ? (
        <div role="dialog" aria-modal="true" onClick={() => setSelectedImage(null)} style={viewer}>
          <button
            type="button"
            aria-label="Close image"
            onClick={() => setSelectedImage(null)}
            style={viewerClose}
          >
            ×
          </button>

          <img alt={listing.title} src={selectedImage} style={viewerImage} />
        </div>
      ) : null}
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '38px 40px 90px',
};

const back: React.CSSProperties = {
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 800,
};

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1.35fr) minmax(300px,.65fr)',
  gap: 34,
  marginTop: 24,
};

const mainImage: React.CSSProperties = {
  overflow: 'hidden',
  aspectRatio: '4 / 3',
  borderRadius: 26,
  background: '#edf3ef',
};

const image: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
  cursor: 'zoom-in',
};

const emptyImage: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  color: '#87958e',
};

const thumbs: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5,1fr)',
  gap: 8,
  marginTop: 9,
};

const thumbButton: React.CSSProperties = {
  aspectRatio: '1',
  overflow: 'hidden',
  padding: 0,
  border: 0,
  borderRadius: 12,
  cursor: 'pointer',
};

const thumbImage: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const eyebrow: React.CSSProperties = {
  color: '#08714a',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
};

const heading: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 38,
  lineHeight: 1.08,
};

const price: React.CSSProperties = {
  marginTop: 14,
  color: '#08714a',
  fontSize: 30,
  fontWeight: 950,
};

const tags: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  marginTop: 14,
};

const pill: React.CSSProperties = {
  padding: '6px 9px',
  borderRadius: 999,
  background: '#eef5f1',
  color: '#4b6357',
  fontSize: 11,
  fontWeight: 750,
};

const description: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  marginTop: 22,
  color: '#405449',
  lineHeight: 1.65,
};

const info: React.CSSProperties = {
  marginTop: 18,
  padding: 15,
  border: '1px solid #e0e8e3',
  borderRadius: 15,
  background: '#fff',
};

const saveButton: React.CSSProperties = {
  width: '100%',
  marginTop: 18,
  padding: '12px 18px',
  border: 0,
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 850,
};

const notice: React.CSSProperties = {
  marginTop: 12,
  padding: 13,
  borderRadius: 13,
  background: '#fff7e9',
  color: '#7a5520',
  fontSize: 12,
  lineHeight: 1.5,
};

const meta: React.CSSProperties = {
  marginTop: 15,
  color: '#849188',
  fontSize: 12,
};

const errorStyle: React.CSSProperties = {
  color: '#aa322d',
};

const viewer: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'grid',
  placeItems: 'center',
  padding: 50,
  background: 'rgba(0,0,0,.94)',
};

const viewerClose: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  right: 25,
  border: 0,
  background: 'transparent',
  color: '#fff',
  fontSize: 40,
  cursor: 'pointer',
};

const viewerImage: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
};
