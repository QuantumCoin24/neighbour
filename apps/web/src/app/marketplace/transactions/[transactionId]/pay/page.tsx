'use client';

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useParams, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function StripePaymentForm({
  transactionId,
  fulfilment,
  paymentMethod,
}: {
  transactionId: string;
  fulfilment: string;
  paymentMethod: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements || busy) {
      return;
    }

    setBusy(true);
    setError('');

    const confirmationParams = new URLSearchParams({
      purchase: 'confirmed',
      fulfilment,
      payment: paymentMethod,
    });

    const returnUrl =
      `${window.location.origin}` +
      `/marketplace/transactions/${transactionId}` +
      `?${confirmationParams.toString()}`;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message ?? 'Stripe could not complete the payment.');
      setBusy(false);
      return;
    }

    if (
      result.paymentIntent &&
      (result.paymentIntent.status === 'succeeded' ||
        result.paymentIntent.status === 'processing' ||
        result.paymentIntent.status === 'requires_capture')
    ) {
      window.location.assign(returnUrl);
      return;
    }

    setError('Payment has not completed yet. Please try again.');
    setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      <div
        style={{
          padding: 18,
          border: '1px solid #deded9',
          borderRadius: 16,
          background: '#fff',
          marginBottom: 18,
        }}
      >
        <PaymentElement />
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 12,
            background: '#fff1f1',
            color: '#9f2020',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || busy}
        style={{
          width: '100%',
          border: 0,
          borderRadius: 14,
          padding: '16px 18px',
          background: '#08714a',
          color: '#fff',
          fontSize: 16,
          fontWeight: 850,
          cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.65 : 1,
        }}
      >
        {busy ? 'Processing payment…' : 'Pay securely'}
      </button>
    </form>
  );
}

export default function MarketplaceStripePaymentPage() {
  const params = useParams<{ transactionId: string }>();
  const searchParams = useSearchParams();

  const clientSecret = searchParams.get('clientSecret')?.trim() ?? '';

  const fulfilment = searchParams.get('fulfilment')?.trim() ?? 'Confirmed';

  const paymentMethod = searchParams.get('payment')?.trim() ?? 'CARD';

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
      },
    }),
    [clientSecret],
  );

  if (!publishableKey) {
    return (
      <main style={page}>
        <section style={shell}>
          <h1 style={heading}>Payment unavailable</h1>
          <p style={muted}>Stripe is not configured for the web application.</p>
        </section>
      </main>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <main style={page}>
        <section style={shell}>
          <h1 style={heading}>Payment unavailable</h1>
          <p style={muted}>The Stripe payment session is unavailable.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={page}>
      <section style={shell}>
        <p style={eyebrow}>NEIGHBOUR™ MARKETPLACE</p>

        <h1 style={heading}>Secure payment</h1>

        <p style={muted}>
          Complete your card payment securely with Stripe. Your purchase is confirmed only after the
          payment has been accepted.
        </p>

        <Elements stripe={stripePromise} options={options}>
          <StripePaymentForm
            transactionId={params.transactionId}
            fulfilment={fulfilment}
            paymentMethod={paymentMethod}
          />
        </Elements>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f5f5f3',
  padding: '48px 18px 90px',
};

const shell: React.CSSProperties = {
  width: '100%',
  maxWidth: 640,
  margin: '0 auto',
  background: '#fff',
  border: '1px solid #e2e2de',
  borderRadius: 24,
  padding: 28,
  boxShadow: '0 12px 35px rgba(0,0,0,0.05)',
};

const eyebrow: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 1.3,
};

const heading: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 36,
  lineHeight: 1.05,
};

const muted: React.CSSProperties = {
  color: '#626262',
  lineHeight: 1.6,
  margin: '0 0 26px',
};
