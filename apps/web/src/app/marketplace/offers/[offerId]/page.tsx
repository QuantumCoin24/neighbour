'use client';

import {
  acceptMarketplacePeerOffer,
  counterMarketplacePeerOffer,
  declineMarketplacePeerOffer,
  getCurrentUser,
  getMarketplacePeerOffer,
  withdrawMarketplacePeerOffer,
  type AuthUser,
  type MarketplacePeerOffer,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import { priceLabel } from '../../../../components/marketplace/marketplace-ui';

export default function MarketplaceOfferDetailPage() {
  const params = useParams<{ offerId: string }>();

  const [offer, setOffer] = useState<MarketplacePeerOffer | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [counter, setCounter] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');

      const [loadedOffer, currentUser] = await Promise.all([
        getMarketplacePeerOffer(params.offerId),
        getCurrentUser(),
      ]);

      setOffer(loadedOffer);
      setUser(currentUser);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The offer could not be loaded.');
    }
  }

  useEffect(() => {
    void load();
  }, [params.offerId]);

  const active = offer?.status === 'PENDING' || offer?.status === 'COUNTERED';

  const isBuyer = Boolean(offer && user && offer.buyerId === user.id);

  const isSeller = Boolean(offer && user && offer.sellerId === user.id);

  const offerSenderId = offer?.history.at(0)?.actorId ?? null;

  const sellerCanRespond = Boolean(
    offer && user && isSeller && offer.status === 'PENDING' && offerSenderId !== user.id,
  );

  const buyerCanRespondToCounter = Boolean(
    offer && user && isBuyer && offer.status === 'PENDING' && offerSenderId !== user.id,
  );

  const buyerCanWithdraw = Boolean(
    offer && user && isBuyer && offer.status === 'PENDING' && offerSenderId === user.id,
  );

  const counterPence = useMemo(() => {
    const parsed = Number.parseFloat(counter);

    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
  }, [counter]);

  async function perform(action: () => Promise<MarketplacePeerOffer>) {
    setBusy(true);
    setError('');

    try {
      setOffer(await action());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The offer could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  async function sendCounter() {
    if (!offer || !counterPence) {
      setError('Enter a valid counter-offer amount.');
      return;
    }

    await perform(() =>
      counterMarketplacePeerOffer(offer.id, {
        amountPence: counterPence,
        ...(counterMessage.trim() ? { message: counterMessage.trim() } : {}),
      }),
    );

    setCounter('');
    setCounterMessage('');
  }

  if (!offer) {
    return (
      <main style={shell}>
        <Link href="/marketplace/offers" style={back}>
          ← Offers
        </Link>

        <section style={empty}>{error || 'Loading offer…'}</section>
      </main>
    );
  }

  return (
    <main style={shell}>
      <Link href="/marketplace/offers" style={back}>
        ← Offers
      </Link>

      <section style={hero}>
        <div style={eyebrow}>Marketplace offer</div>

        <h1 style={heading}>{offer.listing.title}</h1>

        <strong style={amount}>{priceLabel(offer.amountPence, false)}</strong>

        <div style={status}>{offer.status.replaceAll('_', ' ')}</div>
      </section>

      <div style={columns}>
        <section style={card}>
          <h2>Offer details</h2>

          <p>
            <strong>Buyer:</strong> {offer.buyer.displayName}
          </p>

          <p>
            <strong>Seller:</strong> {offer.seller.displayName}
          </p>

          {offer.message ? (
            <>
              <strong>Message</strong>
              <p>{offer.message}</p>
            </>
          ) : null}

          {sellerCanRespond ? (
            <>
              <h3>Respond to offer</h3>

              <div style={roleNotice}>
                You are the seller. You can accept, decline or counter this buyer offer.
              </div>

              <h3>Counter offer</h3>

              <input
                value={counter}
                onChange={(event) => setCounter(event.target.value)}
                placeholder="Amount in pounds"
                inputMode="decimal"
                style={input}
              />

              <textarea
                value={counterMessage}
                onChange={(event) => setCounterMessage(event.target.value)}
                placeholder="Optional message"
                style={{ ...input, minHeight: 90 }}
              />

              <button
                type="button"
                disabled={busy}
                onClick={() => void sendCounter()}
                style={secondary}
              >
                Send counter offer
              </button>

              <div style={actions}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void perform(() => acceptMarketplacePeerOffer(offer.id))}
                  style={primary}
                >
                  Accept offer
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void perform(() => declineMarketplacePeerOffer(offer.id))}
                  style={secondary}
                >
                  Decline
                </button>
              </div>
            </>
          ) : null}

          {buyerCanRespondToCounter ? (
            <>
              <div style={roleNotice}>
                The seller has countered your offer. You can accept or decline the counter.
              </div>

              <div style={actions}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void perform(() => acceptMarketplacePeerOffer(offer.id))}
                  style={primary}
                >
                  Accept counter offer
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void perform(() => declineMarketplacePeerOffer(offer.id))}
                  style={secondary}
                >
                  Decline counter
                </button>
              </div>
            </>
          ) : null}

          {buyerCanWithdraw ? (
            <div style={actions}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void perform(() => withdrawMarketplacePeerOffer(offer.id))}
                style={danger}
              >
                Withdraw offer
              </button>
            </div>
          ) : null}

          {active && !isBuyer && !isSeller ? (
            <div style={roleNotice}>You are not a participant in this offer.</div>
          ) : null}

          {offer.transaction ? (
            <Link href={`/marketplace/transactions/${offer.transaction.id}`} style={transaction}>
              Open transaction →
            </Link>
          ) : null}

          {error ? <p style={errorStyle}>{error}</p> : null}
        </section>

        <section style={card}>
          <h2>Offer timeline</h2>

          <div style={timeline}>
            {offer.history.map((event, index) => (
              <article key={`${event.createdAt}-${index}`} style={timelineItem}>
                <strong>{event.toStatus.replaceAll('_', ' ')}</strong>

                {event.amountPence !== null ? (
                  <div>{priceLabel(event.amountPence, false)}</div>
                ) : null}

                {event.note ? <p>{event.note}</p> : null}

                <small>{new Date(event.createdAt).toLocaleString('en-GB')}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 1000,
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

const amount: React.CSSProperties = {
  color: '#9af1c4',
  fontSize: 27,
};

const status: React.CSSProperties = {
  marginTop: 8,
  textTransform: 'capitalize',
};

const columns: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.15fr .85fr',
  gap: 18,
  marginTop: 18,
};

const card: React.CSSProperties = {
  padding: 23,
  border: '1px solid #e0e8e3',
  borderRadius: 20,
  background: '#fff',
};

const roleNotice: React.CSSProperties = {
  marginBottom: 16,
  padding: 12,
  borderRadius: 12,
  background: '#eef6f1',
  color: '#456457',
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 44,
  marginTop: 8,
  padding: 11,
  border: '1px solid #d7e4dc',
  borderRadius: 11,
  font: 'inherit',
};

const actions: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 15,
};

const primary: React.CSSProperties = {
  padding: '11px 16px',
  border: 0,
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 850,
};

const secondary: React.CSSProperties = {
  ...primary,
  border: '1px solid #d1ded6',
  background: '#fff',
  color: '#355347',
};

const danger: React.CSSProperties = {
  ...secondary,
  color: '#a43330',
};

const transaction: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 20,
  color: '#08714a',
  textDecoration: 'none',
  fontWeight: 850,
};

const timeline: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const timelineItem: React.CSSProperties = {
  padding: 13,
  borderRadius: 13,
  background: '#f4f8f5',
};

const errorStyle: React.CSSProperties = {
  color: '#a43330',
};

const empty: React.CSSProperties = {
  marginTop: 20,
  padding: 25,
  background: '#fff',
  borderRadius: 18,
};
