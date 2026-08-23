'use client';

import {
  getCurrentUser,
  confirmMarketplaceFulfilment,
  createMarketplaceCollection,
  createMarketplaceDelivery,
  createMarketplaceFulfilment,
  generateMarketplaceFulfilmentPin,
  generateMarketplaceFulfilmentQr,
  getMarketplaceFulfilmentByTransaction,
  verifyMarketplaceFulfilmentPin,
  verifyMarketplaceFulfilmentQr,
  type MarketplaceFulfilment,
  type MarketplaceTransaction,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type CSSProperties, type FormEvent, useCallback, useEffect, useState } from 'react';


function humanise(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB');
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function MarketplaceFulfilmentPage() {
  const params = useParams<{ transactionId: string }>();
  const transactionId = params.transactionId;
  const [userId, setUserId] = useState<string | null>(null);

  const [transaction, setTransaction] = useState<MarketplaceTransaction | null>(null);
  const [fulfilment, setFulfilment] = useState<MarketplaceFulfilment | null>(null);

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');

  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [generatedPinExpiry, setGeneratedPinExpiry] = useState<string | null>(null);

  const [generatedQr, setGeneratedQr] = useState<string | null>(null);
  const [generatedQrExpiry, setGeneratedQrExpiry] = useState<string | null>(null);

  const [verificationValue, setVerificationValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { getMarketplaceTransaction } = await import('@neighbour/api-client');

      const loadedTransaction = await getMarketplaceTransaction(transactionId);

      setTransaction(loadedTransaction);

      const currentUser = await getCurrentUser();
      setUserId(currentUser.id);

      try {
        const loadedFulfilment = await getMarketplaceFulfilmentByTransaction(transactionId);

        setFulfilment(loadedFulfilment);
      } catch {
        setFulfilment(null);
      }
    } catch (caughtError) {
      setError(errorMessage(caughtError, 'We could not load this marketplace transaction.'));
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!fulfilment) {
      return;
    }

    const details =
      fulfilment.method === 'COLLECTION' ? fulfilment.collection : fulfilment.delivery;

    if (details) {
      setAddressLine1(details.addressLine1 ?? '');
      setAddressLine2(details.addressLine2 ?? '');
      setCity(details.city ?? '');
      setPostcode(details.postcode ?? '');
      setInstructions(details.instructions ?? '');
      setScheduledFor(details.scheduledFor ?? '');
    }

    if (fulfilment.delivery) {
      setCourier(fulfilment.delivery.courier ?? '');
      setTrackingNumber(fulfilment.delivery.trackingNumber ?? '');
    }
  }, [fulfilment]);

  const isSeller = transaction?.sellerId === userId;
  const isBuyer = transaction?.buyerId === userId;

  const run = async (action: () => Promise<void>, fallback: string) => {
    setActing(true);
    setError(null);
    setNotice(null);

    try {
      await action();
    } catch (caughtError) {
      setError(errorMessage(caughtError, fallback));
    } finally {
      setActing(false);
    }
  };

  const refreshFulfilment = async () => {
    const refreshed = await getMarketplaceFulfilmentByTransaction(transactionId);

    setFulfilment(refreshed);
  };


  const saveCollection = async (event: FormEvent) => {
    event.preventDefault();

    if (!fulfilment) {
      return;
    }

    await run(async () => {
      const normalisedAddress = addressLine1.trim();
      const normalisedCity = city.trim();
      const normalisedPostcode = postcode.trim().toUpperCase();

      if (!normalisedAddress || !normalisedCity || !normalisedPostcode || !scheduledFor) {
        throw new Error(
          'Enter the collection address, town or city, postcode, and collection date/time.',
        );
      }

      const parsed = new Date(scheduledFor);

      if (Number.isNaN(parsed.getTime())) {
        throw new Error('Enter a valid collection date and time.');
      }

      const updated = await createMarketplaceCollection(fulfilment.id, {
        addressLine1: normalisedAddress,
        ...(addressLine2.trim() ? { addressLine2: addressLine2.trim() } : {}),
        city: normalisedCity,
        postcode: normalisedPostcode,
        ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
        scheduledFor: parsed.toISOString(),
      });

      setFulfilment(updated);
      setNotice('Collection details saved.');
    }, 'We could not save the collection details.');
  };

  const saveBuyerDelivery = async (event: FormEvent) => {
    event.preventDefault();

    if (!fulfilment) {
      return;
    }

    await run(async () => {
      const normalisedAddress = addressLine1.trim();
      const normalisedCity = city.trim();
      const normalisedPostcode = postcode.trim().toUpperCase();

      if (!normalisedAddress || !normalisedCity || !normalisedPostcode) {
        throw new Error('Enter your delivery address, town or city, and postcode.');
      }

      await createMarketplaceDelivery(fulfilment.id, {
        addressLine1: normalisedAddress,
        ...(addressLine2.trim() ? { addressLine2: addressLine2.trim() } : {}),
        city: normalisedCity,
        postcode: normalisedPostcode,
        ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
      });

      await refreshFulfilment();
      setNotice('Delivery address saved.');
    }, 'We could not save your delivery address.');
  };

  const saveSellerDispatch = async (event: FormEvent) => {
    event.preventDefault();

    if (!fulfilment) {
      return;
    }

    await run(async () => {
      if (!fulfilment.delivery) {
        throw new Error(
          'The buyer must save their delivery address before dispatch details can be added.',
        );
      }

      await createMarketplaceDelivery(fulfilment.id, {
        courier: courier.trim(),
        trackingNumber: trackingNumber.trim(),
        ...(scheduledFor ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
      });

      await refreshFulfilment();
      setNotice('Dispatch details saved.');
    }, 'We could not save the dispatch details.');
  };

  const generatePin = async () => {
    if (!fulfilment) {
      return;
    }

    await run(async () => {
      const result = await generateMarketplaceFulfilmentPin(fulfilment.id);

      setGeneratedPin(result.pin);
      setGeneratedPinExpiry(result.expiresAt);
      setGeneratedQr(null);
      setGeneratedQrExpiry(null);
      setNotice('Collection PIN generated.');
    }, 'We could not generate a handover PIN.');
  };

  const generateQr = async () => {
    if (!fulfilment) {
      return;
    }

    await run(async () => {
      const result = await generateMarketplaceFulfilmentQr(fulfilment.id);

      setGeneratedQr(result.token);
      setGeneratedQrExpiry(result.expiresAt);
      setGeneratedPin(null);
      setGeneratedPinExpiry(null);
      setNotice('QR handover token generated.');
    }, 'We could not generate a QR handover token.');
  };

  const verifyPin = async () => {
    if (!fulfilment) {
      return;
    }

    await run(async () => {
      if (!verificationValue.trim()) {
        throw new Error('Enter the seller handover PIN.');
      }

      const updated = await verifyMarketplaceFulfilmentPin(fulfilment.id, verificationValue.trim());

      setFulfilment(updated);
      setVerificationValue('');
      setNotice('Handover PIN verified.');
    }, 'The handover PIN could not be verified.');
  };

  const verifyQr = async () => {
    if (!fulfilment) {
      return;
    }

    await run(async () => {
      if (!verificationValue.trim()) {
        throw new Error('Enter the seller QR handover token.');
      }

      const updated = await verifyMarketplaceFulfilmentQr(fulfilment.id, verificationValue.trim());

      setFulfilment(updated);
      setVerificationValue('');
      setNotice('QR handover token verified.');
    }, 'The QR handover token could not be verified.');
  };

  const confirm = async () => {
    if (!fulfilment) {
      return;
    }

    await run(async () => {
      const updated = await confirmMarketplaceFulfilment(fulfilment.id);

      setFulfilment(updated);

      if (updated.status === 'COMPLETED') {
        setNotice('Fulfilment completed by both parties.');
      } else {
        setNotice('Your confirmation is recorded. Waiting for the other party.');
      }
    }, 'We could not confirm fulfilment.');
  };

  if (loading) {
    return (
      <main style={page}>
        <section style={panel}>
          <p style={eyebrow}>NEIGHBOUR™ MARKETPLACE</p>
          <h1 style={title}>Loading fulfilment…</h1>
        </section>
      </main>
    );
  }

  if (!transaction) {
    return (
      <main style={page}>
        <section style={panel}>
          <p style={eyebrow}>NEIGHBOUR™ MARKETPLACE</p>
          <h1 style={title}>Fulfilment unavailable</h1>
          <p style={muted}>{error ?? 'This transaction could not be loaded.'}</p>
          <Link href={`/marketplace/transactions/${transactionId}`} style={secondaryLink}>
            Back to transaction
          </Link>
        </section>
      </main>
    );
  }

  if (!isSeller && !isBuyer) {
    return (
      <main style={page}>
        <section style={panel}>
          <p style={eyebrow}>NEIGHBOUR™ MARKETPLACE</p>
          <h1 style={title}>Private transaction</h1>
          <p style={muted}>Only the buyer and seller can access fulfilment.</p>
        </section>
      </main>
    );
  }

  const currentUserConfirmed = isSeller
    ? fulfilment?.sellerConfirmedAt !== null
    : fulfilment?.buyerConfirmedAt !== null;

  const otherPartyConfirmed = isSeller
    ? fulfilment?.buyerConfirmedAt !== null
    : fulfilment?.sellerConfirmedAt !== null;

  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <div>
            <p style={eyebrow}>NEIGHBOUR™ MARKETPLACE</p>
            <h1 style={title}>Fulfilment</h1>
            <p style={muted}>Securely arrange the handover between buyer and seller.</p>
          </div>

          <Link href={`/marketplace/transactions/${transactionId}`} style={secondaryLink}>
            ← Transaction
          </Link>
        </header>

        {error ? <div style={errorBox}>{error}</div> : null}
        {notice ? <div style={noticeBox}>{notice}</div> : null}

        {!fulfilment ? (
          <section style={panel}>
            <p style={sectionLabel}>HANDOVER METHOD</p>
            <h2 style={sectionTitle}>How will the item be exchanged?</h2>

            <p style={muted}>
              {isSeller
                ? 'The buyer’s checkout is preparing the fulfilment details for this sale.'
                : 'Your checkout is preparing the fulfilment details for this purchase.'}
            </p>
          </section>
        ) : (
          <>
            <section style={panel}>
              <div style={summaryGrid}>
                <div>
                  <p style={fieldLabel}>METHOD</p>
                  <strong>{humanise(fulfilment.method)}</strong>
                </div>

                <div>
                  <p style={fieldLabel}>STATUS</p>
                  <strong>{humanise(fulfilment.status)}</strong>
                </div>

                <div>
                  <p style={fieldLabel}>YOUR ROLE</p>
                  <strong>{isSeller ? 'Seller' : 'Buyer'}</strong>
                </div>

                <div>
                  <p style={fieldLabel}>COMPLETED</p>
                  <strong>{formatDate(fulfilment.completedAt)}</strong>
                </div>
              </div>
            </section>

            {isSeller && fulfilment.method === 'COLLECTION' ? (
              <section style={panel}>
                <p style={sectionLabel}>COLLECTION</p>
                <h2 style={sectionTitle}>Arrange collection</h2>

                <form onSubmit={saveCollection} style={form}>
                  <input
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    placeholder="Collection address"
                    style={input}
                  />

                  <input
                    value={addressLine2}
                    onChange={(event) => setAddressLine2(event.target.value)}
                    placeholder="Address line 2 (optional)"
                    style={input}
                  />

                  <div style={twoColumns}>
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Town or city"
                      style={input}
                    />

                    <input
                      value={postcode}
                      onChange={(event) => setPostcode(event.target.value)}
                      placeholder="Postcode"
                      style={input}
                    />
                  </div>

                  <label style={label}>
                    Collection date and time
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(event) => setScheduledFor(event.target.value)}
                      style={input}
                    />
                  </label>

                  <textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="Collection instructions (optional)"
                    rows={3}
                    style={textarea}
                  />

                  <button disabled={acting} type="submit" style={primaryButton}>
                    {acting ? 'Saving…' : 'Save collection'}
                  </button>
                </form>
              </section>
            ) : null}

            {isBuyer && fulfilment.method !== 'COLLECTION' ? (
              <section style={panel}>
                <p style={sectionLabel}>DELIVERY ADDRESS</p>
                <h2 style={sectionTitle}>Where should it be sent?</h2>

                <p style={muted}>
                  Your address is used only to fulfil this marketplace transaction.
                </p>

                <form onSubmit={saveBuyerDelivery} style={form}>
                  <input
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    placeholder="Address"
                    style={input}
                  />

                  <input
                    value={addressLine2}
                    onChange={(event) => setAddressLine2(event.target.value)}
                    placeholder="Address line 2 (optional)"
                    style={input}
                  />

                  <div style={twoColumns}>
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Town or city"
                      style={input}
                    />

                    <input
                      value={postcode}
                      onChange={(event) => setPostcode(event.target.value)}
                      placeholder="Postcode"
                      style={input}
                    />
                  </div>

                  <textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="Delivery instructions (optional)"
                    rows={3}
                    style={textarea}
                  />

                  <button disabled={acting} type="submit" style={primaryButton}>
                    {acting ? 'Saving…' : 'Save delivery address'}
                  </button>
                </form>
              </section>
            ) : null}

            {isSeller && fulfilment.method !== 'COLLECTION' ? (
              <section style={panel}>
                <p style={sectionLabel}>DISPATCH</p>
                <h2 style={sectionTitle}>Delivery details</h2>

                {fulfilment.delivery ? (
                  <>
                    <div style={addressCard}>
                      <p style={fieldLabel}>DELIVER TO</p>
                      <strong>{fulfilment.delivery.addressLine1}</strong>
                      {fulfilment.delivery.addressLine2 ? (
                        <span>{fulfilment.delivery.addressLine2}</span>
                      ) : null}
                      <span>{fulfilment.delivery.city}</span>
                      <span>{fulfilment.delivery.postcode}</span>
                    </div>

                    <form onSubmit={saveSellerDispatch} style={form}>
                      <input
                        value={courier}
                        onChange={(event) => setCourier(event.target.value)}
                        placeholder="Courier"
                        style={input}
                      />

                      <input
                        value={trackingNumber}
                        onChange={(event) => setTrackingNumber(event.target.value)}
                        placeholder="Tracking number"
                        style={input}
                      />

                      <label style={label}>
                        Scheduled delivery/dispatch (optional)
                        <input
                          type="datetime-local"
                          value={scheduledFor}
                          onChange={(event) => setScheduledFor(event.target.value)}
                          style={input}
                        />
                      </label>

                      <button disabled={acting} type="submit" style={primaryButton}>
                        {acting ? 'Saving…' : 'Save dispatch details'}
                      </button>
                    </form>
                  </>
                ) : (
                  <p style={muted}>Waiting for the buyer to save their delivery address.</p>
                )}
              </section>
            ) : null}

            {isBuyer && fulfilment.method === 'COLLECTION' && fulfilment.collection ? (
              <section style={panel}>
                <p style={sectionLabel}>COLLECTION DETAILS</p>
                <h2 style={sectionTitle}>Your collection</h2>

                <div style={addressCard}>
                  <strong>{fulfilment.collection.addressLine1}</strong>
                  {fulfilment.collection.addressLine2 ? (
                    <span>{fulfilment.collection.addressLine2}</span>
                  ) : null}
                  <span>{fulfilment.collection.city}</span>
                  <span>{fulfilment.collection.postcode}</span>
                  <span>{formatDate(fulfilment.collection.scheduledFor)}</span>
                  {fulfilment.collection.instructions ? (
                    <span>{fulfilment.collection.instructions}</span>
                  ) : null}
                </div>
              </section>
            ) : null}

            {fulfilment.method === 'COLLECTION' ? (
              <section style={panel}>
                <p style={sectionLabel}>SECURE HANDOVER</p>
                <h2 style={sectionTitle}>Verify the exchange</h2>

                {isSeller ? (
                  <>
                    <p style={muted}>
                      Generate a temporary PIN or QR token and give it to the buyer during the
                      handover.
                    </p>

                    <div style={buttonRow}>
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void generatePin()}
                        style={primaryButton}
                      >
                        Generate PIN
                      </button>

                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void generateQr()}
                        style={secondaryButton}
                      >
                        Generate QR token
                      </button>
                    </div>

                    {generatedPin ? (
                      <div style={codeCard}>
                        <p style={fieldLabel}>HANDOVER PIN</p>
                        <strong style={code}>{generatedPin}</strong>
                        <span style={muted}>Expires {formatDate(generatedPinExpiry)}</span>
                      </div>
                    ) : null}

                    {generatedQr ? (
                      <div style={codeCard}>
                        <p style={fieldLabel}>QR TOKEN</p>
                        <code style={token}>{generatedQr}</code>
                        <span style={muted}>Expires {formatDate(generatedQrExpiry)}</span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p style={muted}>Enter the temporary handover value shown by the seller.</p>

                    <input
                      value={verificationValue}
                      onChange={(event) => setVerificationValue(event.target.value)}
                      placeholder="PIN or QR token"
                      style={input}
                    />

                    <div style={buttonRow}>
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void verifyPin()}
                        style={primaryButton}
                      >
                        Verify PIN
                      </button>

                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => void verifyQr()}
                        style={secondaryButton}
                      >
                        Verify QR token
                      </button>
                    </div>
                  </>
                )}
              </section>
            ) : null}

            <section style={panel}>
              <p style={sectionLabel}>CONFIRMATION</p>
              <h2 style={sectionTitle}>Complete the handover</h2>

              <div style={confirmationGrid}>
                <div style={confirmationCard}>
                  <p style={fieldLabel}>YOU</p>
                  <strong>{currentUserConfirmed ? 'Confirmed' : 'Not confirmed'}</strong>
                </div>

                <div style={confirmationCard}>
                  <p style={fieldLabel}>{isSeller ? 'BUYER' : 'SELLER'}</p>
                  <strong>{otherPartyConfirmed ? 'Confirmed' : 'Not confirmed'}</strong>
                </div>
              </div>

              {fulfilment.status !== 'COMPLETED' && !currentUserConfirmed ? (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void confirm()}
                  style={primaryButton}
                >
                  {acting ? 'Confirming…' : 'Confirm handover'}
                </button>
              ) : null}

              {fulfilment.status === 'COMPLETED' ? (
                <div style={completeBox}>✓ Fulfilment complete</div>
              ) : null}
            </section>

            <section style={panel}>
              <p style={sectionLabel}>ACTIVITY</p>
              <h2 style={sectionTitle}>Fulfilment timeline</h2>

              {fulfilment.timeline.length ? (
                <div style={timeline}>
                  {fulfilment.timeline.map((item) => (
                    <div key={item.id} style={timelineItem}>
                      <div>
                        <strong>{humanise(item.type)}</strong>
                        {item.note ? <p style={timelineNote}>{item.note}</p> : null}
                      </div>

                      <time style={timelineTime}>{formatDate(item.createdAt)}</time>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={muted}>No fulfilment activity yet.</p>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

const page: CSSProperties = {
  minHeight: '100vh',
  background: '#f5f5f3',
  padding: '32px 18px 72px',
  color: '#111111',
};

const shell: CSSProperties = {
  width: '100%',
  maxWidth: 920,
  margin: '0 auto',
  display: 'grid',
  gap: 18,
};

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  flexWrap: 'wrap',
  marginBottom: 6,
};

const panel: CSSProperties = {
  width: '100%',
  maxWidth: 920,
  margin: '0 auto',
  boxSizing: 'border-box',
  background: '#ffffff',
  border: '1px solid #e4e4df',
  borderRadius: 22,
  padding: 24,
};

const eyebrow: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.13em',
};

const title: CSSProperties = {
  margin: 0,
  fontSize: 34,
  lineHeight: 1.05,
  letterSpacing: '-0.04em',
};

const muted: CSSProperties = {
  color: '#6b6b66',
  lineHeight: 1.55,
};

const sectionLabel: CSSProperties = {
  margin: '0 0 7px',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.12em',
  color: '#76766f',
};

const sectionTitle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 22,
  letterSpacing: '-0.025em',
};

const fieldLabel: CSSProperties = {
  margin: '0 0 5px',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.11em',
  color: '#777770',
};

const methodGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 12,
  marginTop: 18,
};

const methodButton: CSSProperties = {
  appearance: 'none',
  border: '1px solid #deded8',
  borderRadius: 18,
  background: '#fafaf8',
  padding: 18,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'grid',
  gap: 8,
  font: 'inherit',
};

const methodDescription: CSSProperties = {
  color: '#696963',
  fontSize: 13,
  lineHeight: 1.45,
};

const summaryGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 20,
};

const form: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const twoColumns: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const input: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d9d9d3',
  borderRadius: 13,
  padding: '13px 14px',
  background: '#ffffff',
  color: '#111111',
  font: 'inherit',
};

const textarea: CSSProperties = {
  ...input,
  resize: 'vertical',
};

const label: CSSProperties = {
  display: 'grid',
  gap: 7,
  color: '#555550',
  fontSize: 13,
  fontWeight: 650,
};

const primaryButton: CSSProperties = {
  appearance: 'none',
  border: 0,
  borderRadius: 999,
  background: '#111111',
  color: '#ffffff',
  padding: '12px 18px',
  font: 'inherit',
  fontWeight: 750,
  cursor: 'pointer',
  width: 'fit-content',
};

const secondaryButton: CSSProperties = {
  ...primaryButton,
  background: '#eeeeea',
  color: '#111111',
};

const secondaryLink: CSSProperties = {
  display: 'inline-flex',
  textDecoration: 'none',
  color: '#111111',
  fontWeight: 700,
  border: '1px solid #d9d9d3',
  borderRadius: 999,
  padding: '10px 15px',
  background: '#ffffff',
};

const buttonRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 14,
};

const addressCard: CSSProperties = {
  display: 'grid',
  gap: 4,
  background: '#f7f7f4',
  borderRadius: 16,
  padding: 17,
  marginBottom: 18,
};

const codeCard: CSSProperties = {
  display: 'grid',
  gap: 7,
  background: '#f7f7f4',
  borderRadius: 16,
  padding: 18,
  marginTop: 16,
};

const code: CSSProperties = {
  fontSize: 34,
  letterSpacing: '0.16em',
};

const token: CSSProperties = {
  display: 'block',
  overflowWrap: 'anywhere',
  fontSize: 13,
  lineHeight: 1.5,
};

const confirmationGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginBottom: 18,
};

const confirmationCard: CSSProperties = {
  background: '#f7f7f4',
  borderRadius: 15,
  padding: 16,
};

const completeBox: CSSProperties = {
  background: '#f0f7f0',
  border: '1px solid #d6e7d6',
  borderRadius: 14,
  padding: 15,
  fontWeight: 750,
};

const errorBox: CSSProperties = {
  background: '#fff2f2',
  border: '1px solid #f0cccc',
  borderRadius: 14,
  padding: 14,
  color: '#8f2424',
};

const noticeBox: CSSProperties = {
  background: '#f2f7f2',
  border: '1px solid #d8e7d8',
  borderRadius: 14,
  padding: 14,
  color: '#285b2d',
};

const timeline: CSSProperties = {
  display: 'grid',
};

const timelineItem: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  padding: '14px 0',
  borderBottom: '1px solid #eeeeea',
};

const timelineNote: CSSProperties = {
  margin: '5px 0 0',
  color: '#6b6b66',
  fontSize: 13,
};

const timelineTime: CSSProperties = {
  flexShrink: 0,
  color: '#777770',
  fontSize: 12,
};
