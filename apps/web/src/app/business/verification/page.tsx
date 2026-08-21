'use client';

import Link from 'next/link';

import {
  useEffect,
  useState,
} from 'react';

import {
  getBusinessVerification,
  getMyBusiness,
  submitBusinessVerification,
  type Business,
  type BusinessVerification,
} from '@neighbour/api-client';

export default function BusinessVerificationPage() {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [verification, setVerification] =
    useState<BusinessVerification | null>(
      null,
    );

  const [notes, setNotes] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function load() {
    try {
      const current =
        await getMyBusiness();

      setBusiness(current);

      if (current) {
        const status =
          await getBusinessVerification(
            current.id,
          );

        setVerification(status);
      }
    } catch {
      setMessage(
        'Unable to load business verification.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit() {
    if (
      !business ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const result =
        await submitBusinessVerification(
          business.id,
          {
            notes:
              notes.trim() ||
              undefined,
          },
        );

      setVerification(result);

      setMessage(
        'Verification request submitted.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Verification submission failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="verification-loading">
        Loading verification…

        <style>{`
          .verification-loading {
            width: min(100% - 48px,900px);
            margin: 80px auto;
            padding: 24px;
            border-radius: 18px;
            background: #fff;
          }
        `}</style>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="verification-empty">
        <h1>No business profile</h1>

        <Link href="/business/profile">
          Create business profile
        </Link>

        <style>{`
          .verification-empty {
            width: min(100% - 48px,900px);
            margin: 80px auto;
            padding: 50px;
            border-radius: 20px;
            background: #fff;
            text-align: center;
          }
        `}</style>
      </main>
    );
  }

  const status =
    verification?.status ??
    'NOT SUBMITTED';

  const approved =
    status === 'APPROVED';

  return (
    <main className="verification-page">
      <header className="verification-header">
        <div>
          <div className="verification-eyebrow">
            BUSINESS TRUST
          </div>

          <h1>Verification</h1>

          <p>
            Build visible trust around your local
            business identity.
          </p>
        </div>

        <Link href="/business/dashboard">
          Dashboard
        </Link>
      </header>

      <section className="verification-hero">
        <div>
          <span>CURRENT STATUS</span>

          <h2>{status}</h2>

          <p>{business.name}</p>
        </div>

        <div className="verification-status">
          <span
            className={
              approved
                ? 'verification-dot-approved'
                : ''
            }
          />

          {approved
            ? 'Verified business'
            : 'Verification workflow'}
        </div>
      </section>

      <section className="verification-layout">
        <div className="verification-main">
          <div className="verification-card">
            <span>BUSINESS</span>

            <h2>{business.name}</h2>

            <p>
              {business.description ||
                'Neighbour™ business profile.'}
            </p>

            <div className="verification-business-meta">
              <div>
                <strong>
                  {business.category}
                </strong>
                <small>Category</small>
              </div>

              <div>
                <strong>
                  {approved
                    ? 'Trusted'
                    : 'Active'}
                </strong>
                <small>Trust state</small>
              </div>
            </div>
          </div>

          {!approved ? (
            <div className="verification-card">
              <span>REQUEST VERIFICATION</span>

              <h2>
                Tell us about your business
              </h2>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                placeholder="Optional notes supporting your verification request"
              />

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void submit()
                }
              >
                {busy
                  ? 'Submitting…'
                  : verification
                    ? 'Resubmit verification'
                    : 'Submit verification'}
              </button>
            </div>
          ) : (
            <div className="verification-approved">
              <div>✓</div>

              <section>
                <strong>
                  Verification approved
                </strong>

                <p>
                  FPSHQ has an approved business
                  verification record and no new
                  request is required.
                </p>
              </section>
            </div>
          )}
        </div>

        <aside className="verification-rail">
          <div className="verification-rail-card">
            <span>SUBMITTED</span>

            <strong>
              {verification?.submittedAt
                ? new Date(
                    verification.submittedAt,
                  ).toLocaleDateString(
                    'en-GB',
                  )
                : '—'}
            </strong>
          </div>

          <div className="verification-rail-card">
            <span>REVIEWED</span>

            <strong>
              {verification?.reviewedAt
                ? new Date(
                    verification.reviewedAt,
                  ).toLocaleDateString(
                    'en-GB',
                  )
                : '—'}
            </strong>
          </div>

          <div className="verification-trust-note">
            <strong>
              Neighbour™ trust
            </strong>

            <p>
              Verification gives neighbours a
              clearer signal that the business
              has completed the trust process.
            </p>
          </div>
        </aside>
      </section>

      {message ? (
        <div className="verification-message">
          {message}
        </div>
      ) : null}

      <style>{`
        .verification-page {
          width: min(100% - 48px,1200px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .verification-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 25px;
        }

        .verification-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .verification-header h1 {
          margin: 0;
          font-size: clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .verification-header p {
          margin: 8px 0 0;
          color: #76837c;
          font-size: 13px;
        }

        .verification-header a {
          padding: 11px 15px;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .verification-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 25px;
          border-radius: 22px;
          background:
            linear-gradient(
              120deg,
              #09182a,
              #143554
            );
          color: #fff;
        }

        .verification-hero > div:first-child > span {
          color: #8edcb9;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .verification-hero h2 {
          margin: 7px 0 0;
          font-size: 26px;
        }

        .verification-hero p {
          margin: 3px 0 0;
          color:
            rgba(255,255,255,.64);
          font-size: 10px;
        }

        .verification-status {
          display: flex;
          gap: 7px;
          align-items: center;
          color:
            rgba(255,255,255,.82);
          font-size: 10px;
          font-weight: 800;
        }

        .verification-status span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e2ad3b;
        }

        .verification-status
          .verification-dot-approved {
          background: #43d58b;
        }

        .verification-layout {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            280px;
          gap: 16px;
          margin-top: 20px;
        }

        .verification-main,
        .verification-rail {
          display: grid;
          gap: 13px;
          align-content: start;
        }

        .verification-card,
        .verification-approved,
        .verification-rail-card,
        .verification-trust-note {
          padding: 20px;
          border: 1px solid #e1e7e3;
          border-radius: 17px;
          background: #fff;
        }

        .verification-card > span,
        .verification-rail-card > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .verification-card h2 {
          margin: 7px 0 0;
          font-size: 18px;
        }

        .verification-card > p {
          margin: 6px 0 0;
          color: #77847d;
          font-size: 10px;
        }

        .verification-business-meta {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 8px;
          margin-top: 16px;
        }

        .verification-business-meta div {
          padding: 12px;
          border-radius: 11px;
          background: #f7f9f8;
        }

        .verification-business-meta strong,
        .verification-business-meta small {
          display: block;
        }

        .verification-business-meta strong {
          color: #086240;
          font-size: 11px;
        }

        .verification-business-meta small {
          margin-top: 3px;
          color: #8b9690;
          font-size: 8px;
        }

        .verification-card textarea {
          width: 100%;
          min-height: 120px;
          box-sizing: border-box;
          margin-top: 15px;
          padding: 11px;
          border: 1px solid #dce4df;
          border-radius: 11px;
          background: #fbfcfb;
          font: inherit;
          font-size: 10px;
        }

        .verification-card button {
          margin-top: 10px;
          padding: 10px 13px;
          border: 0;
          border-radius: 10px;
          background: #086240;
          color: #fff;
          font: inherit;
          font-size: 9px;
          font-weight: 800;
        }

        .verification-approved {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: #edf7f1;
        }

        .verification-approved > div {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          flex: 0 0 35px;
          border-radius: 11px;
          background: #08704a;
          color: #fff;
          font-weight: 900;
        }

        .verification-approved strong {
          color: #175b3e;
          font-size: 11px;
        }

        .verification-approved p {
          margin: 5px 0 0;
          color: #648074;
          font-size: 9px;
          line-height: 1.5;
        }

        .verification-rail-card strong {
          display: block;
          margin-top: 7px;
          font-size: 14px;
        }

        .verification-trust-note {
          background: #f4f8f6;
        }

        .verification-trust-note strong {
          color: #28503f;
          font-size: 10px;
        }

        .verification-trust-note p {
          margin: 5px 0 0;
          color: #74827a;
          font-size: 9px;
          line-height: 1.5;
        }

        .verification-message {
          margin-top: 15px;
          padding: 11px 13px;
          border-radius: 11px;
          background: #f2f6f4;
          color: #52675d;
          font-size: 9px;
        }

        @media (max-width: 820px) {
          .verification-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .verification-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .verification-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
