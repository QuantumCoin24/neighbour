'use client';

import {
  confirmPremiumStripeCheckout,
  createPremiumStripeCheckout,
  createPremiumStripePortal,
  getMyPremiumOverview,
  getPremiumPlans,
  submitPrioritySupportRequest,
  type PremiumBillingInterval,
  type PremiumOverview,
  type PremiumPlan,
  type PremiumPlanId,
} from '@neighbour/api-client';
import { useCallback, useEffect, useState } from 'react';

import PageContainer from '../../components/layout/PageContainer';
import { getAccessToken } from '../../lib/auth';

const ENTITLEMENTS: Array<[keyof PremiumOverview['entitlements'], string]> = [
  ['premiumProfile', 'Premium profile'],
  ['advancedSearch', 'Advanced search — up to 50 results per category'],
  ['enhancedStorage', 'Enhanced storage — up to 1 GB'],
  ['communityBoosts', 'Community discovery boosts'],
  ['marketplaceBoosts', 'Marketplace boosts'],
  ['businessAnalytics', 'Business analytics'],
  ['scheduledOffers', 'Scheduled business offers'],
  ['prioritySupport', 'Priority support'],
];

function formatMoney(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}

function formatStatus(value: string): string {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function PremiumPage() {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [overview, setOverview] = useState<PremiumOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billingInterval, setBillingInterval] = useState<PremiumBillingInterval>('MONTHLY');
  const [checkoutPlan, setCheckoutPlan] = useState<PremiumPlanId | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState('');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportResult, setSupportResult] = useState('');

  const loadPremium = useCallback(async () => {
    if (!getAccessToken()) {
      window.location.replace('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [planResult, overviewResult] = await Promise.all([
        getPremiumPlans(),
        getMyPremiumOverview(),
      ]);

      setPlans(planResult);
      setOverview(overviewResult);
    } catch {
      setError('Premium information could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPremium();
  }, [loadPremium]);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);

    const checkout = parameters.get('checkout');
    const sessionId = parameters.get('session_id');

    if (checkout === 'cancelled') {
      setCheckoutResult('Checkout cancelled. No subscription change was made.');
      window.history.replaceState({}, '', '/premium');
      return;
    }

    if (checkout !== 'success' || !sessionId) {
      return;
    }

    let active = true;

    async function confirmCheckout() {
      setCheckoutResult('Confirming your Premium membership…');

      try {
        const result = await confirmPremiumStripeCheckout(sessionId);

        if (!active) {
          return;
        }

        setOverview(result);
        setCheckoutResult('Premium membership activated successfully.');
      } catch {
        if (active) {
          setCheckoutResult(
            'Payment completed, but membership confirmation needs another refresh.',
          );
        }
      } finally {
        window.history.replaceState({}, '', '/premium');
      }
    }

    void confirmCheckout();

    return () => {
      active = false;
    };
  }, []);

  async function startCheckout(plan: PremiumPlanId): Promise<void> {
    if (plan === 'FREE' || checkoutPlan || overview?.subscription.provider === 'APPLE') {
      return;
    }

    setCheckoutPlan(plan);
    setCheckoutResult('');

    try {
      const checkout = await createPremiumStripeCheckout({
        plan,
        interval: billingInterval,
      });

      window.location.assign(checkout.url);
    } catch {
      setCheckoutPlan(null);
      setCheckoutResult('Checkout could not be started. Please try again.');
    }
  }

  async function openBillingPortal(): Promise<void> {
    if (portalBusy) {
      return;
    }

    setPortalBusy(true);
    setCheckoutResult('');

    try {
      const portal = await createPremiumStripePortal();

      window.location.assign(portal.url);
    } catch {
      setPortalBusy(false);
      setCheckoutResult('Billing management could not be opened.');
    }
  }

  async function submitPrioritySupport(): Promise<void> {
    const subject = supportSubject.trim();
    const message = supportMessage.trim();

    if (!subject || !message || supportBusy) {
      return;
    }

    setSupportBusy(true);
    setSupportResult('');

    try {
      const request = await submitPrioritySupportRequest({
        subject,
        message,
      });

      setSupportSubject('');
      setSupportMessage('');

      setSupportResult(`Priority support request ${request.id.slice(0, 8)} has been opened.`);
    } catch {
      setSupportResult('Support request not sent. Please check the details and try again.');
    } finally {
      setSupportBusy(false);
    }
  }

  return (
    <PageContainer>
      <div className="premium-page">
        <section className="premium-hero">
          <div className="premium-kicker">Neighbour Premium™</div>

          <h1>More from your neighbourhood</h1>

          <p>
            Unlock more ways to discover, connect and grow while the essential Neighbour experience
            stays free for everyone.
          </p>
        </section>

        {loading ? <div className="premium-notice">Checking your membership…</div> : null}

        {error ? (
          <button
            type="button"
            className="premium-notice premium-error"
            onClick={() => {
              void loadPremium();
            }}
          >
            {error} <strong>Retry</strong>
          </button>
        ) : null}

        {overview ? (
          <section className="premium-card premium-summary">
            <div>
              <span>Current plan</span>
              <strong>{overview.plan.name}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{formatStatus(overview.subscription.status)}</strong>
            </div>

            <div>
              <span>Provider</span>
              <strong>{formatStatus(overview.subscription.provider)}</strong>
            </div>

            {overview.subscription.currentPeriodEnd ? (
              <div>
                <span>Current period ends</span>

                <strong>
                  {new Date(overview.subscription.currentPeriodEnd).toLocaleDateString('en-GB')}
                </strong>
              </div>
            ) : null}
          </section>
        ) : null}

        <section>
          <div className="premium-section-heading">
            <div>
              <div className="premium-kicker premium-kicker-dark">Membership</div>

              <h2>Choose the level that fits you</h2>
            </div>
          </div>

          <div className="premium-billing-toggle">
            <button
              type="button"
              className={billingInterval === 'MONTHLY' ? 'premium-toggle-active' : ''}
              onClick={() => setBillingInterval('MONTHLY')}
            >
              Monthly
            </button>

            <button
              type="button"
              className={billingInterval === 'ANNUAL' ? 'premium-toggle-active' : ''}
              onClick={() => setBillingInterval('ANNUAL')}
            >
              Annual
            </button>
          </div>

          {checkoutResult ? <div className="premium-notice">{checkoutResult}</div> : null}

          <div className="premium-plans">
            {plans
              .filter((plan) => plan.id !== 'FREE')
              .map((plan) => {
                const current = overview?.subscription.plan === plan.id;

                return (
                  <article
                    key={plan.id}
                    className={`premium-card premium-plan ${
                      plan.recommended ? 'premium-recommended' : ''
                    }`}
                  >
                    <div className="premium-plan-top">
                      <div>
                        <h3>{plan.name}</h3>

                        <div className="premium-price">
                          {formatMoney(
                            billingInterval === 'ANNUAL'
                              ? plan.annualPricePence
                              : plan.monthlyPricePence,
                          )}

                          <small>{billingInterval === 'ANNUAL' ? '/year' : '/month'}</small>
                        </div>
                      </div>

                      {current ? (
                        <span className="premium-badge">Current</span>
                      ) : plan.recommended ? (
                        <span className="premium-badge">Recommended</span>
                      ) : null}
                    </div>

                    <p>{plan.description}</p>

                    <div className="premium-annual">
                      {formatMoney(plan.annualPricePence)} annually
                    </div>

                    <div className="premium-features">
                      {plan.features.map((feature) => (
                        <div key={feature}>✓ {feature}</div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="premium-primary"
                      disabled={
                        current ||
                        Boolean(checkoutPlan) ||
                        overview?.subscription.provider === 'APPLE'
                      }
                      onClick={() => {
                        void startCheckout(plan.id);
                      }}
                    >
                      {current
                        ? 'Your plan'
                        : checkoutPlan === plan.id
                          ? 'Opening secure checkout…'
                          : 'Choose this plan'}
                    </button>
                  </article>
                );
              })}
          </div>
        </section>

        {overview ? (
          <section className="premium-card premium-benefits">
            <div className="premium-kicker premium-kicker-dark">Included now</div>

            <h2>Your active Premium benefits</h2>

            <div className="premium-benefit-grid">
              {ENTITLEMENTS.filter(([key]) => overview.entitlements[key]).map(([, label]) => (
                <div className="premium-benefit" key={label}>
                  <span>✓</span>

                  {label}
                </div>
              ))}
            </div>

            {overview.subscription.plan === 'FREE' ? (
              <p>Upgrade to Plus or Business to activate additional Premium benefits.</p>
            ) : null}
          </section>
        ) : null}

        {overview?.entitlements.prioritySupport ? (
          <section className="premium-card premium-support">
            <div className="premium-kicker premium-kicker-dark">Premium care</div>

            <h2>Priority support</h2>

            <p>Plus and Business requests enter the Premium support queue.</p>

            <input
              placeholder="What do you need help with?"
              value={supportSubject}
              onChange={(event) => {
                setSupportSubject(event.target.value);
              }}
            />

            <textarea
              rows={6}
              placeholder="Tell us what happened"
              value={supportMessage}
              onChange={(event) => {
                setSupportMessage(event.target.value);
              }}
            />

            <button
              type="button"
              className="premium-primary"
              disabled={supportBusy || !supportSubject.trim() || !supportMessage.trim()}
              onClick={() => {
                void submitPrioritySupport();
              }}
            >
              {supportBusy ? 'Sending…' : 'Send priority request'}
            </button>

            {supportResult ? <div className="premium-support-result">{supportResult}</div> : null}
          </section>
        ) : null}

        <section id="premium-web-billing" className="premium-card premium-billing">
          <div className="premium-kicker premium-kicker-dark">Secure billing</div>

          <h2>Subscription management</h2>

          <p>
            Your membership status and Premium benefits are shared across Neighbour on web and
            iPhone.
          </p>

          {overview?.subscription.provider === 'APPLE' ? (
            <>
              <p>
                Your current subscription is billed by Apple. Apple subscriptions must continue to
                be managed through your Apple account.
              </p>

              <a
                className="premium-secondary"
                href="https://apps.apple.com/account/subscriptions"
                target="_blank"
                rel="noreferrer"
              >
                Manage Apple subscription
              </a>
            </>
          ) : overview?.subscription.provider === 'STRIPE' ? (
            <>
              <p>
                Your subscription is securely billed by Stripe. Use the billing portal to update
                your payment method, view invoices, change or cancel your subscription.
              </p>

              <button
                type="button"
                className="premium-secondary"
                disabled={portalBusy}
                onClick={() => {
                  void openBillingPortal();
                }}
              >
                {portalBusy ? 'Opening billing…' : 'Manage web subscription'}
              </button>
            </>
          ) : (
            <>
              <p>
                Choose Neighbour Plus or Neighbour Business above to subscribe securely in your
                browser with Stripe.
              </p>

              <span className="premium-secure-copy">
                Secure hosted checkout • GBP billing • Monthly or annual plans
              </span>
            </>
          )}
        </section>
      </div>

      <style>{`
        .premium-page {
          display: grid;
          gap: 22px;
          padding-bottom: 40px;
        }

        .premium-hero {
          padding: clamp(28px, 5vw, 56px);
          border-radius: 28px;
          background: linear-gradient(135deg, #063f2a, #0e754d);
          color: white;
          box-shadow: 0 22px 55px rgba(6, 63, 42, .18);
        }

        .premium-kicker {
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 11px;
          font-weight: 850;
          color: #a7f3d0;
        }

        .premium-kicker-dark {
          color: #0e754d;
        }

        .premium-hero h1 {
          max-width: 760px;
          margin: 12px 0 16px;
          font-size: clamp(34px, 6vw, 62px);
          line-height: .98;
          letter-spacing: -.045em;
        }

        .premium-hero p {
          max-width: 720px;
          margin: 0;
          color: rgba(255, 255, 255, .82);
          font-size: 17px;
          line-height: 1.65;
        }

        .premium-card {
          padding: 24px;
          border: 1px solid rgba(16, 32, 25, .08);
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 12px 35px rgba(16, 32, 25, .055);
        }

        .premium-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
        }

        .premium-summary > div {
          display: grid;
          gap: 5px;
          padding: 14px;
          border-radius: 15px;
          background: #f7f4ee;
        }

        .premium-summary span {
          color: #68766f;
          font-size: 12px;
        }

        .premium-summary strong {
          font-size: 15px;
        }

        .premium-section-heading h2,
        .premium-benefits h2,
        .premium-support h2,
        .premium-billing h2 {
          margin: 6px 0 14px;
          font-size: 25px;
          letter-spacing: -.025em;
        }

        .premium-billing-toggle {
          display: inline-flex;
          gap: 4px;
          margin-bottom: 16px;
          padding: 4px;
          border-radius: 14px;
          background: #ebe8e1;
        }

        .premium-billing-toggle button {
          padding: 9px 15px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #56655e;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .premium-billing-toggle .premium-toggle-active {
          background: #ffffff;
          color: #086240;
          box-shadow: 0 3px 10px rgba(16, 32, 25, .08);
        }

        .premium-secure-copy {
          display: block;
          margin-top: 10px;
          color: #68766f;
          font-size: 12px;
          font-weight: 700;
        }

        .premium-plans {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .premium-plan {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .premium-recommended {
          border-color: rgba(14, 117, 77, .35);
        }

        .premium-plan-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .premium-plan h3 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        .premium-price {
          color: #0e754d;
          font-size: 30px;
          font-weight: 900;
        }

        .premium-price small {
          color: #68766f;
          font-size: 12px;
          font-weight: 700;
        }

        .premium-badge {
          height: max-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: #e8f5ed;
          color: #086240;
          font-size: 11px;
          font-weight: 850;
        }

        .premium-plan p,
        .premium-support p,
        .premium-benefits p,
        .premium-billing p {
          color: #68766f;
          line-height: 1.6;
        }

        .premium-annual {
          color: #68766f;
          font-size: 12px;
          font-weight: 750;
        }

        .premium-features {
          display: grid;
          flex: 1;
          gap: 9px;
          font-size: 13px;
        }

        .premium-primary,
        .premium-secondary,
        .premium-notice {
          padding: 13px 16px;
          border: 0;
          border-radius: 14px;
          font: inherit;
          font-weight: 800;
        }

        .premium-primary {
          background: #0e754d;
          color: white;
          cursor: pointer;
        }

        .premium-primary:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .premium-secondary {
          display: inline-block;
          width: max-content;
          background: #e8f5ed;
          color: #086240;
          text-decoration: none;
          cursor: pointer;
        }

        .premium-secondary:disabled {
          color: #68766f;
          cursor: not-allowed;
        }

        .premium-benefit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 10px;
        }

        .premium-benefit {
          display: flex;
          gap: 9px;
          padding: 12px;
          border-radius: 14px;
          background: #f7f4ee;
          font-size: 13px;
          font-weight: 700;
        }

        .premium-benefit span {
          color: #0e754d;
        }

        .premium-support {
          display: grid;
          gap: 12px;
        }

        .premium-support input,
        .premium-support textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 13px 14px;
          border: 1px solid rgba(16, 32, 25, .14);
          border-radius: 14px;
          background: #fbfaf7;
          color: #102019;
          font: inherit;
        }

        .premium-support textarea {
          resize: vertical;
        }

        .premium-support-result {
          padding: 12px 14px;
          border-radius: 12px;
          background: #f7f4ee;
          font-size: 13px;
        }

        .premium-notice {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid rgba(16, 32, 25, .08);
          background: white;
          color: #102019;
          text-align: left;
        }

        button.premium-notice {
          cursor: pointer;
        }

        .premium-error {
          border-color: #b42318;
          color: #8b1e16;
        }

        .premium-billing {
          scroll-margin-top: 24px;
        }

        @media (max-width: 640px) {
          .premium-hero {
            border-radius: 22px;
          }

          .premium-card {
            padding: 18px;
          }

          .premium-plans {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageContainer>
  );
}
