'use client';

import {
  createMarketplaceDelivery,
  createMarketplaceFulfilment,
  createMarketplacePayment,
  getMarketplaceListing,
  getMarketplacePaymentMethods,
  purchaseMarketplaceListing,
  type MarketplaceFulfilmentMethod,
  type MarketplaceListing,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { priceLabel } from '../../../../components/marketplace/marketplace-ui';

export default function MarketplaceCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [fulfilmentMethod, setFulfilmentMethod] =
    useState<MarketplaceFulfilmentMethod | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [instructions, setInstructions] = useState('');

  const [paymentMethods, setPaymentMethods] =
    useState<Awaited<ReturnType<typeof getMarketplacePaymentMethods>> | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void Promise.all([
      getMarketplaceListing(params.id),
      getMarketplacePaymentMethods(),
    ])
      .then(([loadedListing, loadedPaymentMethods]) => {
        if (!active) return;

        setListing(loadedListing);
        setPaymentMethods(loadedPaymentMethods);

        const available: MarketplaceFulfilmentMethod[] = [];

        if (loadedListing.collectionAvailable) available.push('COLLECTION');
        if (loadedListing.deliveryAvailable) available.push('DELIVERY');
        if (loadedListing.postageAvailable) available.push('POSTAGE');

        if (available.length === 1) {
          setFulfilmentMethod(available[0]);
        }

        const firstEnabled =
          loadedPaymentMethods.methods?.find((method) => method.enabled);

        setPaymentMethod(firstEnabled?.id ?? '');
      })
      .catch((caught) => {
        if (!active) return;

        setError(
          caught instanceof Error
            ? caught.message
            : 'Checkout could not be loaded.',
        );
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const fulfilmentOptions = useMemo(() => {
    if (!listing) return [];

    const options: Array<{
      id: MarketplaceFulfilmentMethod;
      title: string;
      description: string;
    }> = [];

    if (listing.collectionAvailable) {
      options.push({
        id: 'COLLECTION',
        title: 'Collection',
        description: 'Collect directly from the seller.',
      });
    }

    if (listing.deliveryAvailable) {
      options.push({
        id: 'DELIVERY',
        title: 'Delivery',
        description: 'Have the item delivered locally.',
      });
    }

    if (listing.postageAvailable) {
      options.push({
        id: 'POSTAGE',
        title: 'Postage',
        description: 'Have the item sent by post or courier.',
      });
    }

    return options;
  }, [listing]);

  const needsAddress =
    fulfilmentMethod === 'DELIVERY' ||
    fulfilmentMethod === 'POSTAGE';

  const addressComplete =
    !needsAddress ||
    (
      addressLine1.trim().length > 0 &&
      city.trim().length > 0 &&
      postcode.trim().length > 0
    );

  async function confirmPurchase() {
    if (
      !listing ||
      !fulfilmentMethod ||
      !paymentMethod ||
      !addressComplete ||
      busy
    ) {
      return;
    }

    try {
      setBusy(true);
      setError('');

      /*
       * Existing engines remain authoritative:
       *
       * 1. Purchase/reserve transaction
       * 2. Persist BUYER'S fulfilment choice
       * 3. Create payment
       *
       * No commission/payment/fulfilment calculations are duplicated here.
       */

      const transaction = await purchaseMarketplaceListing(listing.id);

      const fulfilment = await createMarketplaceFulfilment(
        transaction.id,
        {
          method: fulfilmentMethod,
        },
      );

      if (needsAddress) {
        await createMarketplaceDelivery(fulfilment.id, {
          addressLine1: addressLine1.trim(),
          ...(addressLine2.trim()
            ? { addressLine2: addressLine2.trim() }
            : {}),
          city: city.trim(),
          postcode: postcode.trim().toUpperCase(),
          ...(instructions.trim()
            ? { instructions: instructions.trim() }
            : {}),
        });
      }

      const payment = await createMarketplacePayment({
        transactionId: transaction.id,
        method: paymentMethod as never,
        amountPence: transaction.agreedPricePence,
      });

      if (
        payment.provider === 'STRIPE' &&
        payment.method === 'CARD'
      ) {
        if (
          payment.status !== 'REQUIRES_ACTION' ||
          !payment.clientSecret
        ) {
          throw new Error(
            'Stripe card payment could not be started.',
          );
        }

        const paymentParams = new URLSearchParams({
          clientSecret: payment.clientSecret,
          fulfilment: fulfilmentMethod,
          payment: paymentMethod,
        });

        router.push(
          `/marketplace/transactions/${transaction.id}/pay?${paymentParams.toString()}`,
        );

        return;
      }

      const confirmationParams = new URLSearchParams({
        purchase: 'confirmed',
        fulfilment: fulfilmentMethod,
        payment: paymentMethod,
      });

      router.push(
        `/marketplace/transactions/${transaction.id}?${confirmationParams.toString()}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Your purchase could not be completed.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!listing) {
    return (
      <main style={page}>
        <section style={shell}>
          <p style={eyebrow}>NEIGHBOUR™ MARKETPLACE</p>
          <h1 style={title}>
            {error ? 'Checkout unavailable' : 'Opening checkout…'}
          </h1>

          {error ? <div style={errorBox}>{error}</div> : null}
        </section>
      </main>
    );
  }

  const enabledPaymentMethods =
    paymentMethods?.methods?.filter((method) => method.enabled) ?? [];

  return (
    <main style={page}>
      <section style={shell}>
        <header>
          <Link href={`/marketplace/${listing.id}`} style={back}>
            ← Back to listing
          </Link>

          <p style={eyebrow}>NEIGHBOUR™ MARKETPLACE</p>
          <h1 style={title}>Checkout</h1>
          <p style={muted}>
            Choose how you want it and complete your purchase.
          </p>
        </header>

        {error ? <div style={errorBox}>{error}</div> : null}

        <section style={card}>
          <p style={sectionLabel}>YOUR ITEM</p>
          <h2 style={itemTitle}>{listing.title}</h2>
          <strong style={price}>
            {priceLabel(listing.pricePence, false)}
          </strong>
        </section>

        <section style={card}>
          <p style={sectionLabel}>GETTING IT TO YOU</p>
          <h2 style={cardTitle}>Choose one</h2>

          <div style={optionGrid}>
            {fulfilmentOptions.map((option) => {
              const selected = fulfilmentMethod === option.id;

              return (
                <label
                  key={option.id}
                  style={{
                    ...optionCard,
                    borderColor: selected ? '#08714a' : '#ddddda',
                    boxShadow: selected
                      ? '0 0 0 1px #08714a'
                      : 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="fulfilment"
                    checked={selected}
                    onChange={() => setFulfilmentMethod(option.id)}
                  />

                  <span>
                    <strong>{option.title}</strong>
                    <small style={optionDescription}>
                      {option.description}
                    </small>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {needsAddress ? (
          <section style={card}>
            <p style={sectionLabel}>
              {fulfilmentMethod === 'POSTAGE'
                ? 'POSTAGE ADDRESS'
                : 'DELIVERY ADDRESS'}
            </p>

            <h2 style={cardTitle}>Where should it go?</h2>

            <div style={formGrid}>
              <input
                value={addressLine1}
                onChange={(event) =>
                  setAddressLine1(event.target.value)
                }
                placeholder="Address line 1"
                autoComplete="address-line1"
                style={input}
              />

              <input
                value={addressLine2}
                onChange={(event) =>
                  setAddressLine2(event.target.value)
                }
                placeholder="Address line 2 (optional)"
                autoComplete="address-line2"
                style={input}
              />

              <div style={twoColumns}>
                <input
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  placeholder="Town or city"
                  autoComplete="address-level2"
                  style={input}
                />

                <input
                  value={postcode}
                  onChange={(event) =>
                    setPostcode(event.target.value)
                  }
                  placeholder="Postcode"
                  autoComplete="postal-code"
                  style={input}
                />
              </div>

              <textarea
                value={instructions}
                onChange={(event) =>
                  setInstructions(event.target.value)
                }
                placeholder="Delivery instructions (optional)"
                style={{
                  ...input,
                  minHeight: 90,
                  resize: 'vertical',
                }}
              />
            </div>
          </section>
        ) : null}

        <section style={card}>
          <p style={sectionLabel}>PAYMENT</p>
          <h2 style={cardTitle}>How would you like to pay?</h2>

          {enabledPaymentMethods.length ? (
            <div style={optionGrid}>
              {enabledPaymentMethods.map((method) => {
                const selected = paymentMethod === method.id;

                return (
                  <label
                    key={method.id}
                    style={{
                      ...optionCard,
                      borderColor: selected ? '#08714a' : '#ddddda',
                      boxShadow: selected
                        ? '0 0 0 1px #08714a'
                        : 'none',
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={selected}
                      onChange={() => setPaymentMethod(method.id)}
                    />

                    <span>
                      <strong>{humanise(method.id)}</strong>
                      <small style={optionDescription}>
                        {method.provider}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p style={muted}>
              No Marketplace payment methods are currently enabled.
            </p>
          )}
        </section>

        <section style={summaryCard}>
          <p style={sectionLabel}>ORDER SUMMARY</p>

          <div style={summaryRow}>
            <span>Item</span>
            <strong>{priceLabel(listing.pricePence, false)}</strong>
          </div>

          <div style={summaryRow}>
            <span>Getting it</span>
            <strong>
              {fulfilmentMethod
                ? humanise(fulfilmentMethod)
                : 'Not selected'}
            </strong>
          </div>

          <div style={summaryRow}>
            <span>Payment</span>
            <strong>
              {paymentMethod
                ? humanise(paymentMethod)
                : 'Not selected'}
            </strong>
          </div>

          <div style={divider} />

          <div style={totalRow}>
            <span>Total</span>
            <strong>{priceLabel(listing.pricePence, false)}</strong>
          </div>

          <button
            type="button"
            disabled={
              busy ||
              !fulfilmentMethod ||
              !paymentMethod ||
              !addressComplete
            }
            onClick={() => void confirmPurchase()}
            style={{
              ...primaryButton,
              opacity:
                busy ||
                !fulfilmentMethod ||
                !paymentMethod ||
                !addressComplete
                  ? 0.55
                  : 1,
            }}
          >
            {busy
              ? 'Completing purchase…'
              : `Confirm purchase — ${priceLabel(
                  listing.pricePence,
                  false,
                )}`}
          </button>

          <p style={secureNote}>
            Neighbour™ handles the transaction, payment and fulfilment
            securely in the background.
          </p>
        </section>
      </section>
    </main>
  );
}

function humanise(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f5f5f3',
  padding: '32px 18px 90px',
};

const shell: React.CSSProperties = {
  width: '100%',
  maxWidth: 720,
  margin: '0 auto',
  display: 'grid',
  gap: 18,
};

const back: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: 24,
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 750,
};

const eyebrow: React.CSSProperties = {
  margin: '0 0 7px',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 38,
  lineHeight: 1.05,
};

const muted: React.CSSProperties = {
  color: '#666',
  lineHeight: 1.55,
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e2de',
  borderRadius: 20,
  padding: 22,
};

const summaryCard: React.CSSProperties = {
  ...card,
  display: 'grid',
  gap: 14,
};

const sectionLabel: React.CSSProperties = {
  margin: '0 0 7px',
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: 1.2,
};

const cardTitle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 20,
};

const itemTitle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 22,
};

const price: React.CSSProperties = {
  fontSize: 25,
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const twoColumns: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
};

const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 14px',
  border: '1px solid #d8d8d4',
  borderRadius: 12,
  background: '#fff',
  font: 'inherit',
};

const optionGrid: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const optionCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  border: '1px solid #ddddda',
  borderRadius: 15,
  padding: '15px 16px',
  cursor: 'pointer',
};

const optionDescription: React.CSSProperties = {
  display: 'block',
  color: '#686868',
  marginTop: 3,
};

const summaryRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
};

const totalRow: React.CSSProperties = {
  ...summaryRow,
  fontSize: 20,
};

const divider: React.CSSProperties = {
  height: 1,
  background: '#e7e7e3',
};

const primaryButton: React.CSSProperties = {
  width: '100%',
  marginTop: 5,
  padding: '16px 20px',
  border: 0,
  borderRadius: 14,
  background: '#08714a',
  color: '#fff',
  fontSize: 16,
  fontWeight: 850,
  cursor: 'pointer',
};

const secureNote: React.CSSProperties = {
  margin: 0,
  color: '#6a6a6a',
  textAlign: 'center',
  fontSize: 13,
};

const errorBox: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  border: '1px solid #e8aaaa',
  background: '#fff2f2',
  color: '#8b1717',
};
