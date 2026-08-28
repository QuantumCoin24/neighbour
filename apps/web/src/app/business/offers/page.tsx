'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';

import {
  createBusinessOffer,
  getBusinessOffers,
  getMyBusiness,
  getMyPremiumOverview,
  type Business,
  type BusinessOffer,
} from '@neighbour/api-client';

export default function BusinessOffersPage() {
  const [business, setBusiness] = useState<Business | null>(null);

  const [offers, setOffers] = useState<BusinessOffer[]>([]);

  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');
  const [scheduledOffersEnabled, setScheduledOffersEnabled] = useState(false);
  const [scheduleOffer, setScheduleOffer] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState('');

  async function load() {
    try {
      const current = await getMyBusiness();

      setBusiness(current);

      if (current) {
        const [result, premium] = await Promise.all([
          getBusinessOffers(current.id),
          getMyPremiumOverview().catch(() => null),
        ]);

        setOffers(result);
        setScheduledOffersEnabled(Boolean(premium?.entitlements.scheduledOffers));
      }
    } catch {
      setMessage('Unable to load business offers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!business || busy || !title.trim() || !description.trim()) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const scheduling =
        scheduleOffer && scheduledOffersEnabled
          ? {
              ...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
              ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
            }
          : {};

      await createBusinessOffer(business.id, {
        title: title.trim(),
        description: description.trim(),
        active: true,
        ...scheduling,
      });

      const wasScheduled = scheduleOffer && scheduledOffersEnabled;

      setTitle('');
      setDescription('');
      setScheduleOffer(false);
      setStartsAt('');
      setEndsAt('');
      setMessage(wasScheduled ? 'Scheduled offer created.' : 'Offer created.');

      await load();
    } catch {
      setMessage('Offer creation failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="offers-loading">
        Loading business offers…
        <style>{`
          .offers-loading {
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
      <main className="offers-empty-business">
        <h1>No business profile</h1>

        <Link href="/business/profile">Create business profile</Link>

        <style>{`
          .offers-empty-business {
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

  return (
    <main className="offers-page">
      <header className="offers-header">
        <div>
          <div className="offers-eyebrow">LOCAL BUSINESS OFFERS</div>

          <h1>Offers</h1>

          <p>Create reasons for nearby customers to discover and engage with your business.</p>
        </div>

        <Link href="/business/dashboard">Dashboard</Link>
      </header>

      <section className="offers-overview">
        <div>
          <span>YOUR BUSINESS</span>

          <h2>{business.name}</h2>

          <p>{business.category}</p>
        </div>

        <div className="offers-overview-count">
          <strong>{offers.length}</strong>

          <span>{offers.length === 1 ? 'offer' : 'offers'}</span>
        </div>
      </section>

      <section className="offers-layout">
        <div className="offers-create">
          <div className="offers-panel-heading">
            <span>CREATE OFFER</span>

            <h2>Publish a local offer</h2>

            <p>Your offer will be attached directly to {business.name}.</p>
          </div>

          <label>
            <span>Offer title</span>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: 10% off for local neighbours"
            />
          </label>

          <label>
            <span>Description</span>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the offer"
            />
          </label>

          <div className="offer-scheduling">
            <div className="offer-scheduling-heading">
              <div>
                <span>NEIGHBOUR BUSINESS</span>
                <strong>Schedule this offer</strong>
              </div>

              {scheduledOffersEnabled ? (
                <button
                  type="button"
                  className={scheduleOffer ? 'schedule-toggle schedule-toggle-on' : 'schedule-toggle'}
                  onClick={() => setScheduleOffer((current) => !current)}
                  aria-pressed={scheduleOffer}
                >
                  {scheduleOffer ? 'On' : 'Off'}
                </button>
              ) : (
                <span className="schedule-locked">PREMIUM</span>
              )}
            </div>

            {scheduledOffersEnabled ? (
              scheduleOffer ? (
                <div className="schedule-fields">
                  <label>
                    <span>Starts</span>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                    />
                  </label>

                  <label>
                    <span>Ends</span>
                    <input
                      type="datetime-local"
                      value={endsAt}
                      onChange={(event) => setEndsAt(event.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <p>Turn scheduling on to choose when this offer becomes available.</p>
              )
            ) : (
              <div className="schedule-upgrade">
                <p>Choose future start and end times with Neighbour Business.</p>
                <Link href="/premium">Unlock scheduled offers →</Link>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={busy || !title.trim() || !description.trim()}
            onClick={() => void create()}
          >
            {busy ? 'Publishing…' : 'Publish offer'}
          </button>

          {message ? <div className="offers-message">{message}</div> : null}
        </div>

        <section className="offers-current">
          <div className="offers-panel-heading">
            <span>LIVE OFFERS</span>

            <h2>Current offers</h2>

            <p>Offers currently attached to your Neighbour™ business.</p>
          </div>

          {offers.length === 0 ? (
            <div className="offers-empty">
              <div>◇</div>

              <strong>No offers yet</strong>

              <p>Create your first local offer using the form beside this panel.</p>
            </div>
          ) : (
            <div className="offers-list">
              {offers.map((offer) => (
                <article key={offer.id} className="offer-card">
                  <div className="offer-card-top">
                    <div>
                      <span>{offer.active ? 'ACTIVE' : 'INACTIVE'}</span>

                      <h3>{offer.title}</h3>
                    </div>

                    <div
                      className={offer.active ? 'offer-state offer-state-active' : 'offer-state'}
                    >
                      {offer.active ? 'Live' : 'Inactive'}
                    </div>
                  </div>

                  <p>{offer.description}</p>

                  {offer.startsAt || offer.endsAt ? (
                    <div className="offer-schedule-summary">
                      {offer.startsAt ? (
                        <span>Starts {new Date(offer.startsAt).toLocaleString('en-GB')}</span>
                      ) : null}

                      {offer.endsAt ? (
                        <span>Ends {new Date(offer.endsAt).toLocaleString('en-GB')}</span>
                      ) : null}
                    </div>
                  ) : null}

                  <small>Created {new Date(offer.createdAt).toLocaleDateString('en-GB')}</small>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .offers-page {
          width: min(100% - 48px,1250px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .offer-scheduling {
          margin: 16px 0;
          padding: 15px;
          border: 1px solid #dfe7e2;
          border-radius: 14px;
          background: #f7faf8;
        }

        .offer-scheduling-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .offer-scheduling-heading > div {
          display: grid;
          gap: 3px;
        }

        .offer-scheduling-heading span {
          color: #0a6945;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .offer-scheduling-heading strong {
          color: #102019;
          font-size: 12px;
        }

        .schedule-toggle {
          min-width: 48px;
          padding: 7px 10px;
          border: 0;
          border-radius: 999px;
          background: #dfe7e2;
          color: #53635b;
          font-size: 8px;
          font-weight: 850;
          cursor: pointer;
        }

        .schedule-toggle-on {
          background: #086240;
          color: #fff;
        }

        .schedule-locked {
          padding: 6px 8px;
          border-radius: 999px;
          background: #102019;
          color: #8edcb9 !important;
        }

        .offer-scheduling > p,
        .schedule-upgrade p {
          margin: 10px 0 0;
          color: #75827c;
          font-size: 9px;
          line-height: 1.5;
        }

        .schedule-upgrade a {
          display: inline-flex;
          margin-top: 9px;
          color: #086240;
          text-decoration: none;
          font-size: 9px;
          font-weight: 850;
        }

        .schedule-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          margin-top: 12px;
        }

        .schedule-fields label {
          display: grid;
          gap: 5px;
        }

        .schedule-fields label > span {
          color: #53635b;
          font-size: 8px;
          font-weight: 800;
        }

        .schedule-fields input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 9px;
          border: 1px solid #dce4df;
          border-radius: 9px;
          background: #fff;
          color: #102019;
          font: inherit;
          font-size: 9px;
        }

        .offer-schedule-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 9px 0;
        }

        .offer-schedule-summary span {
          padding: 5px 7px;
          border-radius: 7px;
          background: #eef5f1;
          color: #426052;
          font-size: 8px;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .schedule-fields {
            grid-template-columns: 1fr;
          }
        }

        .offers-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 25px;
        }

        .offers-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .offers-header h1 {
          margin: 0;
          font-size: clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .offers-header p {
          margin: 8px 0 0;
          max-width: 650px;
          color: #75827c;
          font-size: 13px;
        }

        .offers-header a {
          padding: 11px 15px;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .offers-overview {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          padding: 23px;
          border-radius: 21px;
          background:
            linear-gradient(
              120deg,
              #09182a,
              #143554
            );
          color: #fff;
        }

        .offers-overview > div:first-child > span {
          color: #8edcb9;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .offers-overview h2 {
          margin: 6px 0 0;
          font-size: 22px;
        }

        .offers-overview p {
          margin: 4px 0 0;
          color:
            rgba(255,255,255,.62);
          font-size: 9px;
        }

        .offers-overview-count {
          min-width: 90px;
          text-align: center;
        }

        .offers-overview-count strong {
          display: block;
          font-size: 27px;
        }

        .offers-overview-count span {
          color:
            rgba(255,255,255,.63);
          font-size: 8px;
        }

        .offers-layout {
          display: grid;
          grid-template-columns:
            390px minmax(0,1fr);
          gap: 16px;
          margin-top: 20px;
          align-items: start;
        }

        .offers-create,
        .offers-current {
          padding: 21px;
          border: 1px solid #e1e7e3;
          border-radius: 18px;
          background: #fff;
        }

        .offers-panel-heading > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .offers-panel-heading h2 {
          margin: 6px 0 0;
          font-size: 18px;
        }

        .offers-panel-heading p {
          margin: 5px 0 0;
          color: #7b8881;
          font-size: 9px;
          line-height: 1.5;
        }

        .offers-create label {
          display: grid;
          gap: 6px;
          margin-top: 15px;
        }

        .offers-create label > span {
          color: #405249;
          font-size: 9px;
          font-weight: 800;
        }

        .offers-create input,
        .offers-create textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dce4df;
          border-radius: 11px;
          background: #fbfcfb;
          font: inherit;
          font-size: 10px;
        }

        .offers-create input {
          min-height: 43px;
          padding: 0 11px;
        }

        .offers-create textarea {
          min-height: 120px;
          resize: vertical;
          padding: 11px;
        }

        .offers-create button {
          margin-top: 13px;
          padding: 11px 14px;
          border: 0;
          border-radius: 10px;
          background: #086240;
          color: #fff;
          font: inherit;
          font-size: 9px;
          font-weight: 800;
        }

        .offers-create button:disabled {
          opacity: .5;
        }

        .offers-message {
          margin-top: 11px;
          padding: 10px;
          border-radius: 10px;
          background: #f2f6f4;
          color: #596c63;
          font-size: 9px;
        }

        .offers-list {
          display: grid;
          gap: 9px;
          margin-top: 15px;
        }

        .offer-card {
          padding: 15px;
          border-radius: 14px;
          background: #f7f9f8;
        }

        .offer-card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .offer-card-top > div:first-child > span {
          color: #0a6945;
          font-size: 7px;
          font-weight: 850;
          letter-spacing: .1em;
        }

        .offer-card h3 {
          margin: 5px 0 0;
          color: #263b31;
          font-size: 12px;
        }

        .offer-card p {
          margin: 8px 0 0;
          color: #68776f;
          font-size: 9px;
          line-height: 1.5;
        }

        .offer-card small {
          display: block;
          margin-top: 9px;
          color: #99a39e;
          font-size: 7px;
        }

        .offer-state {
          height: fit-content;
          padding: 5px 7px;
          border-radius: 999px;
          background: #ecefed;
          color: #76817b;
          font-size: 7px;
          font-weight: 800;
        }

        .offer-state-active {
          background: #e4f3eb;
          color: #08704a;
        }

        .offers-empty {
          margin-top: 15px;
          padding: 35px 18px;
          border-radius: 14px;
          background: #f7f9f8;
          text-align: center;
        }

        .offers-empty > div {
          color: #08704a;
          font-size: 21px;
        }

        .offers-empty strong {
          display: block;
          margin-top: 7px;
          color: #30453b;
          font-size: 11px;
        }

        .offers-empty p {
          margin: 5px auto 0;
          max-width: 350px;
          color: #7c8982;
          font-size: 9px;
        }

        @media (max-width: 850px) {
          .offers-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .offers-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .offers-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
