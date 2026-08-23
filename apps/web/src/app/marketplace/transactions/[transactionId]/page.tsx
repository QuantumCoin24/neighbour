'use client';

import {
  cancelMarketplaceTransaction,
  completeMarketplaceTransaction,
  getMarketplaceTransaction,
  type MarketplaceTransaction,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { priceLabel } from '../../../../components/marketplace/marketplace-ui';

export default function MarketplaceTransactionDetailPage() {
  const params =
    useParams<{ transactionId: string }>();

  const [transaction, setTransaction] =
    useState<MarketplaceTransaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');

      setTransaction(
        await getMarketplaceTransaction(
          params.transactionId,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Transaction could not be loaded.',
      );
    }
  }

  useEffect(() => {
    void load();
  }, [params.transactionId]);

  async function perform(
    action: () => Promise<MarketplaceTransaction>,
  ) {
    setBusy(true);
    setError('');

    try {
      setTransaction(await action());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Transaction could not be updated.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!transaction) {
    return (
      <main style={shell}>
        <Link
          href="/marketplace/transactions"
          style={back}
        >
          ← Transactions
        </Link>

        <section style={empty}>
          {error || 'Loading transaction…'}
        </section>
      </main>
    );
  }

  const active =
    transaction.status !== 'COMPLETED' &&
    transaction.status !== 'CANCELLED';

  return (
    <main style={shell}>
      <Link
        href="/marketplace/transactions"
        style={back}
      >
        ← Transactions
      </Link>

      <section style={hero}>
        <div style={eyebrow}>Marketplace transaction</div>

        <h1 style={heading}>
          Marketplace trade
        </h1>

        <strong style={price}>
          {priceLabel(
            transaction.agreedPricePence,
            false,
          )}
        </strong>

        <div style={status}>
          {transaction.status.replaceAll('_', ' ')}
        </div>
      </section>

      <div style={columns}>
        <section style={card}>
          <h2>Trade</h2>

          <p>
            <strong>Listing:</strong>{' '}
            {transaction.listingId}
          </p>

          <p>
            <strong>Buyer reference:</strong>{' '}
            {transaction.buyerId}
          </p>

          <p>
            <strong>Seller reference:</strong>{' '}
            {transaction.sellerId}
          </p>

          <p>
            <strong>Reserved:</strong>{' '}
            {new Date(
              transaction.reservedAt,
            ).toLocaleString('en-GB')}
          </p>

          {transaction.expiresAt ? (
            <p>
              <strong>Reservation expires:</strong>{' '}
              {new Date(
                transaction.expiresAt,
              ).toLocaleString('en-GB')}
            </p>
          ) : null}

          {transaction.completedAt ? (
            <p>
              <strong>Completed:</strong>{' '}
              {new Date(
                transaction.completedAt,
              ).toLocaleString('en-GB')}
            </p>
          ) : null}

          {transaction.cancelledAt ? (
            <p>
              <strong>Cancelled:</strong>{' '}
              {new Date(
                transaction.cancelledAt,
              ).toLocaleString('en-GB')}
            </p>
          ) : null}
        </section>

        <section style={card}>
          <h2>Next steps</h2>

          <div style={notice}>
            Payment and fulfilment controls will be attached
            here in the remaining Marketplace parity builds.
            Transaction state remains enforced by the existing
            backend.
          </div>

          {active ? (
            <div style={actions}>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void perform(() =>
                    completeMarketplaceTransaction(
                      transaction.id,
                    ),
                  )
                }
                style={primary}
              >
                Complete sale
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void perform(() =>
                    cancelMarketplaceTransaction(
                      transaction.id,
                    ),
                  )
                }
                style={danger}
              >
                Cancel transaction
              </button>
            </div>
          ) : null}

          {error ? <p style={errorStyle}>{error}</p> : null}
        </section>
      </div>
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 980,
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
  background: '#09271d',
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
  fontSize: 38,
};

const price: React.CSSProperties = {
  color: '#9af1c4',
  fontSize: 26,
};

const status: React.CSSProperties = {
  marginTop: 7,
  textTransform: 'capitalize',
};

const columns: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 18,
  marginTop: 18,
};

const card: React.CSSProperties = {
  padding: 23,
  border: '1px solid #e0e8e3',
  borderRadius: 20,
  background: '#fff',
};

const notice: React.CSSProperties = {
  padding: 13,
  borderRadius: 13,
  background: '#eef6f1',
  color: '#476255',
  lineHeight: 1.5,
};

const actions: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  marginTop: 16,
};

const primary: React.CSSProperties = {
  padding: '12px 16px',
  border: 0,
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 850,
};

const danger: React.CSSProperties = {
  ...primary,
  border: '1px solid #ebcecc',
  background: '#fff',
  color: '#a43330',
};

const errorStyle: React.CSSProperties = {
  color: '#a43330',
};

const empty: React.CSSProperties = {
  marginTop: 20,
  padding: 25,
  borderRadius: 18,
  background: '#fff',
};
