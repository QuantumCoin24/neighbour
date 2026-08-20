'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';

import {
  getMyBusiness,
  type Business,
} from '@neighbour/api-client';

const tools = [
  {
    title: 'Business dashboard',
    description:
      'Your live local business command centre.',
    href: '/business/dashboard',
    icon: '▣',
  },
  {
    title: 'Business profile',
    description:
      'Manage how your business appears locally.',
    href: '/business/profile',
    icon: '◎',
  },
  {
    title: 'Verification',
    description:
      'Build visible trust with neighbours.',
    href: '/business/verification',
    icon: '✓',
  },
  {
    title: 'Offers',
    description:
      'Create and manage local offers.',
    href: '/business/offers',
    icon: '◇',
  },
];

export default function BusinessCentrePage() {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const current =
          await getMyBusiness();

        setBusiness(current);
      } catch {
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <main className="business-page">
      <header className="business-header">
        <div>
          <div className="business-eyebrow">
            NEIGHBOUR™ FOR BUSINESS
          </div>

          <h1>Business Centre</h1>

          <p>
            Build your local presence, connect
            with neighbours and manage your
            business inside the community.
          </p>
        </div>

        {business ? (
          <Link
            href="/business/dashboard"
            className="business-header-action"
          >
            Open dashboard
          </Link>
        ) : null}
      </header>

      <section className="business-hero">
        <div className="business-hero-copy">
          <div className="business-hero-kicker">
            LOCAL BUSINESS, CONNECTED
          </div>

          <h2>
            Grow where your customers already
            live.
          </h2>

          <p>
            Neighbour™ Business connects local
            businesses directly with nearby
            communities.
          </p>

          <div className="business-hero-actions">
            <Link href="/business/dashboard">
              Business dashboard
            </Link>

            <Link
              href="/business/discover"
              className="business-secondary"
            >
              Discover businesses
            </Link>
          </div>
        </div>

        <div className="business-live-card">
          <span>YOUR BUSINESS</span>

          {loading ? (
            <strong>Loading…</strong>
          ) : business ? (
            <>
              <strong>{business.name}</strong>

              <p>{business.category}</p>

              <div className="business-live-status">
                <span />
                {business.verified
                  ? 'Verified'
                  : 'Business active'}
              </div>
            </>
          ) : (
            <>
              <strong>
                No business profile yet
              </strong>

              <p>
                Create your local business
                presence.
              </p>

              <Link href="/business/profile">
                Get started →
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="business-section">
        <div className="business-section-heading">
          <div>
            <h2>Manage your business</h2>

            <p>
              Everything you need to operate
              inside Neighbour™.
            </p>
          </div>
        </div>

        <div className="business-tools">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="business-tool"
            >
              <div className="business-tool-icon">
                {tool.icon}
              </div>

              <div>
                <h3>{tool.title}</h3>

                <p>
                  {tool.description}
                </p>
              </div>

              <span>→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="business-value-grid">
        <article>
          <strong>Local discovery</strong>

          <p>
            Be visible where neighbours are
            already looking.
          </p>
        </article>

        <article>
          <strong>Community trust</strong>

          <p>
            Build reputation and verification
            inside your local network.
          </p>
        </article>

        <article>
          <strong>Offers & engagement</strong>

          <p>
            Give nearby customers a reason to
            visit and return.
          </p>
        </article>
      </section>

      <style>{`
        .business-page {
          width: min(100% - 48px, 1380px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .business-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 26px;
        }

        .business-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .business-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .business-header p {
          max-width: 670px;
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
          line-height: 1.5;
        }

        .business-header-action {
          padding: 12px 17px;
          border-radius: 13px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 850;
        }

        .business-hero {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            310px;
          gap: 18px;
          padding: 28px;
          border-radius: 24px;
          background:
            linear-gradient(
              120deg,
              #09182a,
              #143554
            );
          color: #fff;
        }

        .business-hero-kicker {
          color: #91dfbc;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .business-hero h2 {
          max-width: 650px;
          margin: 10px 0 0;
          font-size: clamp(28px,4vw,42px);
          line-height: 1.05;
          letter-spacing: -.04em;
        }

        .business-hero-copy > p {
          max-width: 620px;
          margin: 13px 0 0;
          color: rgba(255,255,255,.68);
          font-size: 12px;
          line-height: 1.6;
        }

        .business-hero-actions {
          display: flex;
          gap: 9px;
          margin-top: 22px;
        }

        .business-hero-actions a {
          padding: 11px 14px;
          border-radius: 11px;
          background: #0b754d;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 850;
        }

        .business-hero-actions
          .business-secondary {
          background:
            rgba(255,255,255,.09);
          color:
            rgba(255,255,255,.82);
        }

        .business-live-card {
          align-self: stretch;
          padding: 20px;
          border: 1px solid
            rgba(255,255,255,.12);
          border-radius: 18px;
          background:
            rgba(255,255,255,.075);
        }

        .business-live-card > span {
          color: #8fdbb8;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .business-live-card strong {
          display: block;
          margin-top: 10px;
          font-size: 18px;
        }

        .business-live-card p {
          margin: 5px 0 0;
          color:
            rgba(255,255,255,.62);
          font-size: 10px;
        }

        .business-live-card > a {
          display: inline-block;
          margin-top: 16px;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
        }

        .business-live-status {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 18px;
          color:
            rgba(255,255,255,.76);
          font-size: 9px;
          font-weight: 750;
        }

        .business-live-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #44d58c;
        }

        .business-section {
          margin-top: 30px;
        }

        .business-section-heading h2 {
          margin: 0;
          color: #102019;
          font-size: 20px;
        }

        .business-section-heading p {
          margin: 5px 0 0;
          color: #7c8982;
          font-size: 11px;
        }

        .business-tools {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 12px;
          margin-top: 15px;
        }

        .business-tool {
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr) auto;
          gap: 13px;
          align-items: center;
          padding: 18px;
          border: 1px solid #e1e7e3;
          border-radius: 17px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          box-shadow:
            0 10px 30px
            rgba(19,45,34,.035);
        }

        .business-tool-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 16px;
          font-weight: 850;
        }

        .business-tool h3 {
          margin: 0;
          color: #253a30;
          font-size: 12px;
        }

        .business-tool p {
          margin: 4px 0 0;
          color: #77847d;
          font-size: 9px;
        }

        .business-tool > span {
          color: #89958f;
        }

        .business-value-grid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 12px;
          margin-top: 28px;
        }

        .business-value-grid article {
          padding: 18px;
          border-radius: 16px;
          background: #f5f8f6;
        }

        .business-value-grid strong {
          color: #274137;
          font-size: 11px;
        }

        .business-value-grid p {
          margin: 5px 0 0;
          color: #78857e;
          font-size: 9px;
          line-height: 1.5;
        }

        @media (max-width: 850px) {
          .business-hero,
          .business-tools {
            grid-template-columns: 1fr;
          }

          .business-value-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .business-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .business-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
