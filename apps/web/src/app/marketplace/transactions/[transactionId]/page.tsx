'use client';

import {
  completeMarketplaceTransaction,
  confirmMarketplacePayment,
  createMarketplacePayment,
  getMarketplacePaymentMethods,
  getMyMarketplacePayments,
  cancelMarketplaceTransaction,
  getCurrentUser,
  getMarketplaceTransaction,
  type AuthUser,
  type MarketplaceTransaction,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { priceLabel } from '../../../../components/marketplace/marketplace-ui';


type WebMarketplacePayment = Awaited<
  ReturnType<typeof getMyMarketplacePayments>
>[number];

type WebMarketplacePaymentMethods = Awaited<
  ReturnType<typeof getMarketplacePaymentMethods>
>;

export default function MarketplaceTransactionDetailPage() {
  const params =
    useParams<{ transactionId: string }>();

  const [transaction, setTransaction] =
    useState<MarketplaceTransaction | null>(null);

  const [payments, setPayments] =
    useState<WebMarketplacePayment[]>([]);

  const [paymentMethods, setPaymentMethods] =
    useState<WebMarketplacePaymentMethods | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');

      const [loadedTransaction, currentUser,
          loadedPayments,
          loadedPaymentMethods,
        ] =
        await Promise.all([
          getMarketplaceTransaction(
            params.transactionId,
          ),
          getCurrentUser(),
          getMyMarketplacePayments(),
          getMarketplacePaymentMethods(),
        ]);

      setTransaction(loadedTransaction);
      setUser(currentUser);

        setPayments(loadedPayments);
        setPaymentMethods(loadedPaymentMethods);

        const firstEnabledMethod =
          loadedPaymentMethods.methods?.find(
            (method) => method.enabled,
          );

        setSelectedPaymentMethod((current) =>
          current || firstEnabledMethod?.id || '',
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

  async function confirmPaymentReceived() {
    if (
      !currentPayment ||
      !sellerCanConfirmManualPayment
    ) {
      return;
    }

    try {
      setBusy(true);
      setError('');

      await confirmMarketplacePayment(currentPayment.id);

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Payment receipt could not be confirmed.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function completeSale() {
    if (
      !transaction ||
      !sellerCanCompleteSale
    ) {
      return;
    }

    try {
      setBusy(true);
      setError('');

      await completeMarketplaceTransaction(
        transaction.id,
      );

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Marketplace sale could not be completed.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function createPayment() {
    if (
      !transaction ||
      !isBuyer ||
      !selectedPaymentMethod ||
      currentPayment
    ) {
      return;
    }

    try {
      setBusy(true);
      setError('');

      await createMarketplacePayment({
        transactionId: transaction.id,
        method: selectedPaymentMethod as never,
        amountPence: transaction.agreedPricePence,
      });

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to create Marketplace payment.',
      );
    } finally {
      setBusy(false);
    }
  }

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

  const isBuyer =
    Boolean(
      user &&
        transaction.buyerId === user.id,
    );

  const isSeller =
    Boolean(
      user &&
        transaction.sellerId === user.id,
    );

  const isParticipant = isBuyer || isSeller;

  const transactionPayments = payments.filter(
    (payment) => payment.transactionId === transaction?.id,
  );

  const currentPayment =
    transactionPayments.find(
      (payment) =>
        payment.status !== "CANCELLED" &&
        payment.status !== "REFUNDED",
    ) ??
    transactionPayments[0] ??
    null;

  const paymentCaptured = currentPayment?.status === "CAPTURED";

  const manualPaymentPending =
    Boolean(
      currentPayment &&
        currentPayment.provider === 'MANUAL' &&
        currentPayment.status === 'PENDING',
    );

  const sellerCanConfirmManualPayment =
    Boolean(isSeller && manualPaymentPending);

  const sellerCanCompleteSale =
    Boolean(
      isSeller &&
        active &&
        currentPayment &&
        paymentCaptured,
    );

  const enabledPaymentMethods =
    paymentMethods?.methods?.filter((method) => method.enabled) ?? [];

  const canCreatePayment =
    Boolean(
      isBuyer &&
        transaction &&
        active &&
        !currentPayment &&
        enabledPaymentMethods.length > 0,
    );

  const paymentStatusLabel =
    currentPayment?.status
      ?.replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      ) ?? null;


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
          <h2>Payment</h2>

          <div style={paymentGrid}>
            <div>
              <span style={label}>Agreed price</span>
              <strong>
                {priceLabel(transaction.agreedPricePence, false)}
              </strong>
            </div>

            <div>
              <span style={label}>Currency</span>
              <strong>
                {currentPayment?.currency ??
                  paymentMethods?.currency ??
                  'GBP'}
              </strong>
            </div>

            <div>
              <span style={label}>Payment status</span>
              <strong>
                {paymentStatusLabel ?? 'Not started'}
              </strong>
            </div>

            <div>
              <span style={label}>Payment method</span>
              <strong>
                {currentPayment?.method ?? '—'}
              </strong>
            </div>

            <div>
              <span style={label}>Provider</span>
              <strong>
                {currentPayment?.provider ?? '—'}
              </strong>
            </div>
          </div>

          {isBuyer && !currentPayment ? (
            <>
              <div style={paymentNotice}>
                Choose an available payment method to start
                payment for the agreed Marketplace price.
              </div>

              {enabledPaymentMethods.length > 0 ? (
                <div style={paymentMethodList}>
                  {enabledPaymentMethods.map((method) => (
                    <label
                      key={method.id}
                      style={
                        selectedPaymentMethod === method.id
                          ? paymentMethodSelected
                          : paymentMethodOption
                      }
                    >
                      <input
                        type="radio"
                        name="marketplace-payment-method"
                        value={method.id}
                        checked={
                          selectedPaymentMethod ===
                          method.id
                        }
                        onChange={() =>
                          setSelectedPaymentMethod(
                            method.id,
                          )
                        }
                        disabled={busy}
                      />

                      <span>
                        <strong>
                          {method.id
                            .replaceAll('_', ' ')
                            .toLowerCase()
                            .replace(/\b\w/g, (character) =>
                              character.toUpperCase(),
                            )}
                        </strong>

                        <small style={methodDescription}>
                          Provider: {method.provider}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={paymentNotice}>
                  No Marketplace payment methods are currently
                  enabled.
                </div>
              )}

              {canCreatePayment ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createPayment()}
                  style={paymentPrimary}
                >
                  {busy ? 'Starting payment…' : 'Start payment'}
                </button>
              ) : null}
            </>
          ) : null}

          {isBuyer && currentPayment ? (
            <div style={paymentNotice}>
              Your Marketplace payment has been created.
              Current status: <strong>
                {paymentStatusLabel}
              </strong>.
            </div>
          ) : null}

          {isSeller && !currentPayment ? (
            <div style={paymentNotice}>
              Waiting for the buyer to start payment.
            </div>
          ) : null}

          {isSeller && currentPayment ? (
            <>
              <div style={paymentNotice}>
                Buyer payment status: <strong>
                  {paymentStatusLabel}
                </strong>.
              </div>

              {sellerCanConfirmManualPayment ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void confirmPaymentReceived()
                  }
                  style={paymentPrimary}
                >
                  {busy
                    ? 'Confirming payment…'
                    : 'Confirm payment received'}
                </button>
              ) : null}
            </>
          ) : null}

          {paymentCaptured ? (
            <div style={capturedNotice}>
              Payment captured successfully.
            </div>
          ) : null}
        </section>

        <section style={card}>
          <h2>Next steps</h2>

          {isBuyer ? (
            <div style={notice}>
              <strong>You are buying this item.</strong>
              <div style={{ marginTop: 6 }}>
                This trade is reserved for you. Payment and
                fulfilment controls are the next Marketplace
                parity layer.
              </div>
            </div>
          ) : null}

          {isSeller ? (
            <div style={notice}>
              <strong>You are selling this item.</strong>
              <div style={{ marginTop: 6 }}>
                The trade is reserved. Complete Sale will
                become available after Marketplace payment
                has reached the required captured state.
              </div>
            </div>
          ) : null}

          {!isParticipant ? (
            <div style={notice}>
              You are not a participant in this Marketplace
              transaction.
            </div>
          ) : null}

          {active && isParticipant ? (
            <div style={actions}>
              {sellerCanCompleteSale ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void completeSale()}
                  style={paymentPrimary}
                >
                  {busy
                    ? 'Completing sale…'
                    : 'Complete sale'}
                </button>
              ) : null}

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

          {transaction.status === 'COMPLETED' ? (
            <div style={statusNotice}>
              This Marketplace trade has been completed.
            </div>
          ) : null}

          {transaction.status === 'CANCELLED' ? (
            <div style={statusNotice}>
              This Marketplace trade has been cancelled.
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

const paymentGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 14,
  marginBottom: 18,
};

const label: React.CSSProperties = {
  display: 'block',
  marginBottom: 5,
  color: '#718078',
  fontSize: 12,
  fontWeight: 750,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const paymentNotice: React.CSSProperties = {
  marginTop: 12,
  padding: 13,
  borderRadius: 13,
  background: '#f4f7f5',
  color: '#53665c',
  lineHeight: 1.5,
};

const capturedNotice: React.CSSProperties = {
  marginTop: 12,
  padding: 13,
  borderRadius: 13,
  background: '#e9f8f0',
  color: '#17633f',
  fontWeight: 800,
};

const paymentMethodList: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 14,
  marginBottom: 14,
};

const paymentMethodOption: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: 13,
  border: '1px solid #dfe7e2',
  borderRadius: 13,
  background: '#fff',
  cursor: 'pointer',
};

const paymentMethodSelected: React.CSSProperties = {
  ...paymentMethodOption,
  border: '1px solid #08714a',
  background: '#eef8f3',
};

const methodDescription: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  color: '#718078',
  lineHeight: 1.4,
};

const paymentPrimary: React.CSSProperties = {
  marginTop: 4,
  padding: '12px 16px',
  border: 0,
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 850,
};

const danger: React.CSSProperties = {
  padding: '12px 16px',
  border: '1px solid #ebcecc',
  borderRadius: 999,
  background: '#fff',
  color: '#a43330',
  cursor: 'pointer',
  fontWeight: 850,
};

const statusNotice: React.CSSProperties = {
  marginTop: 14,
  padding: 13,
  borderRadius: 13,
  background: '#f4f7f5',
  color: '#53665c',
  lineHeight: 1.5,
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
