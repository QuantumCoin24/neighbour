'use client';

import Link from 'next/link';

import {
  useEffect,
  useState,
} from 'react';

import {
  getBusinessAnalytics,
  getBusinessDashboard,
  getMyBusiness,
} from '@neighbour/api-client';

export default function BusinessDashboardPage() {
  const [dashboard, setDashboard] =
    useState<any>(null);

  const [analytics, setAnalytics] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function load() {
      try {
        const business =
          await getMyBusiness();

        if (!business) {
          setDashboard(null);
          return;
        }

        try {
          const dashboardData =
            await getBusinessDashboard(
              business.id,
            );

          setDashboard(
            dashboardData?.business
              ? dashboardData
              : {
                  ...dashboardData,
                  business,
                  verification:
                    dashboardData?.verification ??
                    null,
                  offers:
                    dashboardData?.offers ??
                    [],
                  events:
                    dashboardData?.events ??
                    [],
                },
          );
        } catch {
          setDashboard({
            business,
            verification: null,
            offers: [],
            events: [],
          });

          setError(
            'Some business dashboard data is temporarily unavailable.',
          );
        }

        try {
          const analyticsData =
            await getBusinessAnalytics(
              business.id,
            );

          setAnalytics(analyticsData);
        } catch {
          setAnalytics(null);
        }
      } catch {
        setError(
          'Unable to load your business account.',
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <main className="business-loading">
        Loading your business centre…

        <style>{`
          .business-loading {
            width: min(100% - 48px,900px);
            margin: 80px auto;
            padding: 24px;
            border-radius: 18px;
            background: #fff;
            color: #68776f;
          }
        `}</style>
      </main>
    );
  }

  if (!dashboard?.business) {
    return (
      <main className="business-empty">
        <div>▣</div>

        <h1>
          Start your business presence
        </h1>

        <p>
          Create your Neighbour™ business
          profile before opening the dashboard.
        </p>

        <Link href="/business/profile">
          Create business profile
        </Link>

        <style>{`
          .business-empty {
            width: min(100% - 48px,850px);
            margin: 80px auto;
            padding: 60px;
            border: 1px dashed #d6e0da;
            border-radius: 22px;
            background: #fff;
            text-align: center;
          }

          .business-empty > div {
            color: #08704a;
            font-size: 30px;
          }

          .business-empty h1 {
            margin: 12px 0 0;
          }

          .business-empty p {
            color: #75827c;
            font-size: 12px;
          }

          .business-empty a {
            display: inline-flex;
            margin-top: 12px;
            padding: 11px 15px;
            border-radius: 11px;
            background: #086240;
            color: #fff;
            text-decoration: none;
            font-size: 10px;
            font-weight: 800;
          }
        `}</style>
      </main>
    );
  }

  const business =
    dashboard.business;

  const verification =
    dashboard.verification;

  const offers =
    dashboard.offers ?? [];

  const events =
    dashboard.events ?? [];

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">
            BUSINESS COMMAND CENTRE
          </div>

          <h1>{business.name}</h1>

          <p>
            Manage your local presence,
            engagement and business activity.
          </p>
        </div>

        <Link href="/business/profile">
          Edit business
        </Link>
      </header>

      {error ? (
        <div className="dashboard-error">
          {error}
        </div>
      ) : null}

      <section className="dashboard-identity">
        <div>
          <span>BUSINESS STATUS</span>

          <h2>
            {business.name}
          </h2>

          <p>
            {business.category}
          </p>
        </div>

        <div className="dashboard-verification">
          <span />
          {verification?.status ??
            (business.verified
              ? 'Verified'
              : 'Active')}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <h2>Overview</h2>

          <p>
            Your business activity at a glance.
          </p>
        </div>

        <div className="dashboard-metrics">
          <Metric
            label="Active offers"
            value={offers.length}
            icon="◇"
          />

          <Metric
            label="Upcoming events"
            value={events.length}
            icon="17"
          />

          <Metric
            label="Profile views"
            value={
              analytics?.profileViews ??
              0
            }
            icon="◎"
          />

          <Metric
            label="Total reach"
            value={
              analytics?.totalReach ??
              0
            }
            icon="⌖"
          />
        </div>
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-main">
          <div className="dashboard-panel">
            <div className="dashboard-panel-title">
              <div>
                <span>ENGAGEMENT</span>

                <h2>
                  Local performance
                </h2>
              </div>
            </div>

            <div className="engagement-grid">
              <div>
                <strong>
                  {analytics?.offerViews ??
                    0}
                </strong>

                <span>Offer views</span>
              </div>

              <div>
                <strong>
                  {analytics?.eventViews ??
                    0}
                </strong>

                <span>Event views</span>
              </div>

              <div>
                <strong>
                  {analytics?.profileViews ??
                    0}
                </strong>

                <span>Profile views</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-title">
              <div>
                <span>ACTIVITY</span>

                <h2>
                  Business tools
                </h2>
              </div>
            </div>

            <div className="dashboard-actions">
              <Link href="/business/offers">
                <strong>Create offer</strong>
                <span>
                  Publish something for nearby
                  customers.
                </span>
              </Link>

              <Link href="/business/profile">
                <strong>Edit profile</strong>
                <span>
                  Keep your business identity
                  current.
                </span>
              </Link>

              <Link href="/business/verification">
                <strong>Verification</strong>
                <span>
                  Review your trust status.
                </span>
              </Link>
            </div>
          </div>
        </div>

        <aside className="dashboard-rail">
          <div className="dashboard-rail-card">
            <span>VERIFICATION</span>

            <h3>
              {verification?.status ??
                'Pending'}
            </h3>

            <p>
              Build trust with neighbours and
              strengthen your local presence.
            </p>

            <Link href="/business/verification">
              View verification →
            </Link>
          </div>

          <div className="dashboard-rail-card">
            <span>BUSINESS REACH</span>

            <h3>
              {analytics?.totalReach ??
                0}
            </h3>

            <p>
              Total recorded community activity.
            </p>
          </div>
        </aside>
      </section>

      <style>{`
        .dashboard-page {
          width: min(100% - 48px,1380px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 24px;
        }

        .dashboard-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .dashboard-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(32px,4vw,46px);
          letter-spacing: -.045em;
        }

        .dashboard-header p {
          margin: 8px 0 0;
          color: #75827c;
          font-size: 13px;
        }

        .dashboard-header > a {
          padding: 11px 15px;
          border: 1px solid #dce4df;
          border-radius: 12px;
          background: #fff;
          color: #284239;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .dashboard-identity {
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

        .dashboard-identity > div:first-child > span {
          color: #8edcb9;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .dashboard-identity h2 {
          margin: 7px 0 0;
          font-size: 24px;
        }

        .dashboard-identity p {
          margin: 4px 0 0;
          color:
            rgba(255,255,255,.62);
          font-size: 10px;
        }

        .dashboard-verification {
          display: flex;
          align-items: center;
          gap: 7px;
          color:
            rgba(255,255,255,.8);
          font-size: 10px;
          font-weight: 800;
        }

        .dashboard-verification span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #43d58b;
        }

        .dashboard-section {
          margin-top: 28px;
        }

        .dashboard-section-heading h2 {
          margin: 0;
          font-size: 19px;
          color: #102019;
        }

        .dashboard-section-heading p {
          margin: 4px 0 0;
          color: #7d8983;
          font-size: 10px;
        }

        .dashboard-metrics {
          display: grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap: 12px;
          margin-top: 13px;
        }

        .metric {
          padding: 17px;
          border: 1px solid #e1e7e3;
          border-radius: 16px;
          background: #fff;
        }

        .metric-icon {
          color: #08704a;
          font-size: 15px;
        }

        .metric strong {
          display: block;
          margin-top: 10px;
          color: #102019;
          font-size: 24px;
        }

        .metric span {
          display: block;
          margin-top: 3px;
          color: #88948e;
          font-size: 9px;
        }

        .dashboard-layout {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            300px;
          gap: 16px;
          margin-top: 22px;
          align-items: start;
        }

        .dashboard-main {
          display: grid;
          gap: 16px;
        }

        .dashboard-panel,
        .dashboard-rail-card {
          padding: 20px;
          border: 1px solid #e1e7e3;
          border-radius: 18px;
          background: #fff;
        }

        .dashboard-panel-title span,
        .dashboard-rail-card > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .dashboard-panel-title h2 {
          margin: 6px 0 0;
          color: #102019;
          font-size: 18px;
        }

        .engagement-grid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .engagement-grid div {
          padding: 15px;
          border-radius: 13px;
          background: #f6f8f7;
        }

        .engagement-grid strong {
          display: block;
          color: #086240;
          font-size: 18px;
        }

        .engagement-grid span {
          display: block;
          margin-top: 4px;
          color: #89958f;
          font-size: 8px;
        }

        .dashboard-actions {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .dashboard-actions a {
          padding: 14px;
          border-radius: 13px;
          background: #f6f8f7;
          color: inherit;
          text-decoration: none;
        }

        .dashboard-actions strong {
          display: block;
          color: #284238;
          font-size: 10px;
        }

        .dashboard-actions span {
          display: block;
          margin-top: 5px;
          color: #839089;
          font-size: 8px;
          line-height: 1.45;
        }

        .dashboard-rail {
          display: grid;
          gap: 12px;
        }

        .dashboard-rail-card h3 {
          margin: 8px 0 0;
          color: #102019;
          font-size: 18px;
        }

        .dashboard-rail-card p {
          margin: 6px 0 0;
          color: #77847d;
          font-size: 9px;
          line-height: 1.5;
        }

        .dashboard-rail-card a {
          display: inline-block;
          margin-top: 12px;
          color: #08704a;
          font-size: 9px;
          font-weight: 800;
        }

        .dashboard-error {
          margin-bottom: 15px;
          padding: 12px;
          border-radius: 11px;
          background: #fff1dc;
          color: #77571d;
          font-size: 10px;
        }

        @media (max-width: 950px) {
          .dashboard-metrics {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

          .dashboard-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .dashboard-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .dashboard-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .dashboard-metrics,
          .engagement-grid,
          .dashboard-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <article className="metric">
      <div className="metric-icon">
        {icon}
      </div>

      <strong>{value}</strong>

      <span>{label}</span>
    </article>
  );
}
