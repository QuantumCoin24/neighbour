'use client';

import {
  createMarketplacePeerOffer,
  getMarketplaceListing,
  type MarketplaceListing,
} from '@neighbour/api-client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { priceLabel } from '../../../../components/marketplace/marketplace-ui';

export default function MakeMarketplaceOfferPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [listing, setListing] =
    useState<MarketplaceListing | null>(null);

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const result = await getMarketplaceListing(params.id);

        if (active) {
          setListing(result);

          if (result.pricePence !== null) {
            setAmount((result.pricePence / 100).toFixed(2));
          }
        }
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'The listing could not be loaded.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [params.id]);

  const amountPence = useMemo(() => {
    const parsed = Number.parseFloat(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return Math.round(parsed * 100);
  }, [amount]);

  async function submit() {
    if (!listing || submitting) return;

    if (!amountPence) {
      setError('Enter a valid offer amount.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const offer = await createMarketplacePeerOffer(
        listing.id,
        {
          amountPence,
          ...(message.trim()
            ? { message: message.trim() }
            : {}),
        },
      );

      router.replace(`/marketplace/offers/${offer.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Your offer could not be sent.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main style={shell}>Opening listing…</main>;
  }

  if (!listing) {
    return (
      <main style={shell}>
        {error || 'Listing unavailable.'}
      </main>
    );
  }

  return (
    <main style={shell}>
      <button
        type="button"
        onClick={() => router.back()}
        style={back}
      >
        ← Back
      </button>

      <section style={hero}>
        <div style={eyebrow}>Neighbour Marketplace™</div>

        <h1 style={heading}>Make an offer</h1>

        <p style={subtitle}>{listing.title}</p>

        <strong style={asking}>
          Asking price:{' '}
          {priceLabel(
            listing.pricePence,
            listing.isFree,
          )}
        </strong>
      </section>

      <section style={card}>
        <label style={labelStyle}>
          Your offer

          <div style={money}>
            <span>£</span>

            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              disabled={submitting}
              style={input}
            />
          </div>
        </label>

        <label style={labelStyle}>
          Message to seller

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            maxLength={1000}
            placeholder="Optional message"
            disabled={submitting}
            style={{ ...input, minHeight: 120 }}
          />
        </label>

        <div style={notice}>
          Offers are not payments. Only agree to
          collection or payment arrangements you understand.
        </div>

        {error ? <p style={errorStyle}>{error}</p> : null}

        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          style={primary}
        >
          {submitting ? 'Sending…' : 'Send offer'}
        </button>
      </section>
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  padding: '40px 40px 90px',
};

const back: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#08714a',
  cursor: 'pointer',
  fontWeight: 850,
};

const hero: React.CSSProperties = {
  marginTop: 20,
  padding: 28,
  borderRadius: 24,
  background:
    'linear-gradient(135deg,#071b14,#0a6847)',
  color: '#fff',
};

const eyebrow: React.CSSProperties = {
  color: '#9af1c4',
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
  margin: '10px 0',
  color: 'rgba(255,255,255,.8)',
};

const asking: React.CSSProperties = {
  fontSize: 20,
};

const card: React.CSSProperties = {
  marginTop: 18,
  padding: 25,
  borderRadius: 22,
  border: '1px solid #dfe9e3',
  background: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  marginBottom: 20,
  fontWeight: 800,
};

const money: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  gap: 7,
};

const input: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 46,
  border: '1px solid #d7e3dc',
  borderRadius: 12,
  padding: '12px 13px',
  font: 'inherit',
};

const notice: React.CSSProperties = {
  marginBottom: 18,
  padding: 13,
  borderRadius: 13,
  background: '#fff7e7',
  color: '#785823',
  lineHeight: 1.5,
};

const errorStyle: React.CSSProperties = {
  color: '#aa322d',
};

const primary: React.CSSProperties = {
  width: '100%',
  padding: '13px 18px',
  border: 0,
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 900,
};
