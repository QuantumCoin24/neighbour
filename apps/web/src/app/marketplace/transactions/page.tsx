'use client';

import {
  getMarketplaceTransactions,
  type MarketplaceTransaction,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { priceLabel } from '../../../components/marketplace/marketplace-ui';

export default function MarketplaceTransactionsPage() {
  const [items, setItems] =
    useState<MarketplaceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setItems(await getMarketplaceTransactions());
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Marketplace transactions could not be loaded.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main style={shell}>
      <Link href="/marketplace" style={back}>
        ← Marketplace
      </Link>

      <section style={hero}>
        <div style={eyebrow}>Trades</div>

        <h1 style={heading}>Transactions</h1>

        <p style={subtitle}>
          Track reserved and completed Marketplace trades.
        </p>
      </section>

      {error ? (
        <section style={empty}>{error}</section>
      ) : loading ? (
        <section style={empty}>
          Loading transactions…
        </section>
      ) : items.length === 0 ? (
        <section style={empty}>
          <strong>No transactions yet.</strong>
          <p>
            Accepted Marketplace offers and direct purchases
            will appear here.
          </p>
        </section>
      ) : (
        <section style={list}>
          {items.map((transaction) => (
            <Link
              key={transaction.id}
              href={`/marketplace/transactions/${transaction.id}`}
              style={card}
            >
              <div>
                <strong>
                  Marketplace trade
                </strong>

                <div style={meta}>
                  Listing {transaction.listingId.slice(0, 8)}
                  {' · '}
                  Buyer {transaction.buyerId.slice(0, 8)}
                  {' · '}
                  Seller {transaction.sellerId.slice(0, 8)}
                </div>
              </div>

              <div style={right}>
                <strong style={amount}>
                  {priceLabel(
                    transaction.agreedPricePence,
                    false,
                  )}
                </strong>

                <span style={status}>
                  {transaction.status
                    .replaceAll('_', ' ')
                    .toLowerCase()}
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <Link href="/marketplace/offers" style={offers}>
        View offers →
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
  background: '#0a2a1f',
  color: '#fff',
};

const eyebrow: React.CSSProperties = {
  color: '#91ecc0',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
};

const heading: React.CSSProperties = {
  margin: '7px 0',
  fontSize: 42,
};

const subtitle: React.CSSProperties = {
  color: 'rgba(255,255,255,.74)',
};

const list: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 18,
};

const card: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  padding: 18,
  border: '1px solid #e0e8e3',
  borderRadius: 18,
  background: '#fff',
  color: '#10251b',
  textDecoration: 'none',
};

const meta: React.CSSProperties = {
  marginTop: 5,
  color: '#75847b',
  fontSize: 12,
};

const right: React.CSSProperties = {
  textAlign: 'right',
};

const amount: React.CSSProperties = {
  display: 'block',
  color: '#08714a',
};

const status: React.CSSProperties = {
  display: 'block',
  marginTop: 5,
  fontSize: 11,
  textTransform: 'capitalize',
};

const empty: React.CSSProperties = {
  marginTop: 18,
  padding: 25,
  border: '1px solid #e0e8e3',
  borderRadius: 18,
  background: '#fff',
};

const offers: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 22,
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 850,
};
