'use client';

import {
  getMyMarketplaceOffers,
  getReceivedMarketplaceOffers,
  type MarketplacePeerOffer,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { priceLabel } from '../../../components/marketplace/marketplace-ui';

type View = 'RECEIVED' | 'SENT';

export default function MarketplaceOffersPage() {
  const [view, setView] = useState<View>('RECEIVED');
  const [items, setItems] =
    useState<MarketplacePeerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result =
        view === 'RECEIVED'
          ? await getReceivedMarketplaceOffers()
          : await getMyMarketplaceOffers();

      setItems(result.items);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Offers could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main style={shell}>
      <Link href="/marketplace" style={back}>
        ← Marketplace
      </Link>

      <section style={hero}>
        <div style={eyebrow}>Negotiations</div>

        <h1 style={heading}>Marketplace offers</h1>

        <p style={subtitle}>
          Track prices you've proposed and offers you've
          received.
        </p>
      </section>

      <div style={tabs}>
        <button
          type="button"
          onClick={() => setView('RECEIVED')}
          style={{
            ...tab,
            ...(view === 'RECEIVED' ? activeTab : {}),
          }}
        >
          Received
        </button>

        <button
          type="button"
          onClick={() => setView('SENT')}
          style={{
            ...tab,
            ...(view === 'SENT' ? activeTab : {}),
          }}
        >
          Sent
        </button>
      </div>

      {error ? (
        <section style={empty}>
          <strong>Offers unavailable</strong>
          <p>{error}</p>
        </section>
      ) : loading ? (
        <section style={empty}>Loading offers…</section>
      ) : items.length === 0 ? (
        <section style={empty}>
          <strong>
            No {view.toLowerCase()} offers
          </strong>
          <p>
            Offers you send and receive will appear here.
          </p>
        </section>
      ) : (
        <section style={list}>
          {items.map((offer) => {
            const person =
              view === 'RECEIVED'
                ? offer.buyer
                : offer.seller;

            return (
              <Link
                key={offer.id}
                href={`/marketplace/offers/${offer.id}`}
                style={card}
              >
                <div>
                  <strong style={title}>
                    {offer.listing.title}
                  </strong>

                  <div style={meta}>
                    {view === 'RECEIVED'
                      ? 'From'
                      : 'To'}{' '}
                    {person.displayName}
                  </div>
                </div>

                <div style={right}>
                  <strong style={amount}>
                    {priceLabel(
                      offer.amountPence,
                      false,
                    )}
                  </strong>

                  <span style={status}>
                    {offer.status
                      .replaceAll('_', ' ')
                      .toLowerCase()}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <Link
        href="/marketplace/transactions"
        style={transactionLink}
      >
        View Marketplace transactions →
      </Link>
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 920,
  margin: '0 auto',
  padding: '40px 40px 90px',
};

const back: React.CSSProperties = {
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 850,
};

const hero: React.CSSProperties = {
  marginTop: 20,
  padding: 28,
  borderRadius: 24,
  background: '#0b2b20',
  color: '#fff',
};

const eyebrow: React.CSSProperties = {
  color: '#8be8bb',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '.15em',
  textTransform: 'uppercase',
};

const heading: React.CSSProperties = {
  margin: '7px 0 0',
  fontSize: 42,
};

const subtitle: React.CSSProperties = {
  margin: '9px 0 0',
  color: 'rgba(255,255,255,.72)',
};

const tabs: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 18,
};

const tab: React.CSSProperties = {
  padding: '10px 17px',
  border: '1px solid #d7e5dd',
  borderRadius: 999,
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 800,
};

const activeTab: React.CSSProperties = {
  background: '#08714a',
  color: '#fff',
  borderColor: '#08714a',
};

const list: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 18,
};

const card: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 18,
  padding: 18,
  border: '1px solid #e0e8e3',
  borderRadius: 18,
  background: '#fff',
  color: '#10251b',
  textDecoration: 'none',
};

const title: React.CSSProperties = {
  fontSize: 17,
};

const meta: React.CSSProperties = {
  marginTop: 5,
  color: '#718078',
  fontSize: 13,
};

const right: React.CSSProperties = {
  textAlign: 'right',
};

const amount: React.CSSProperties = {
  display: 'block',
  color: '#08714a',
  fontSize: 19,
};

const status: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: '#748279',
  fontSize: 11,
  textTransform: 'capitalize',
};

const empty: React.CSSProperties = {
  marginTop: 18,
  padding: 26,
  border: '1px solid #e0e8e3',
  borderRadius: 18,
  background: '#fff',
};

const transactionLink: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 24,
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 850,
};
