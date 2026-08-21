'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getMySecurityReports,
  type SecurityReport,
} from '@neighbour/api-client';

import CreateReportForm from '../../components/security/CreateReportForm';

export default function SecurityPage() {
  const [reports, setReports] =
    useState<SecurityReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    async function load() {
      const token =
        localStorage.getItem(
          'accessToken',
        );

      if (!token) {
        setMessage(
          'No active session.',
        );

        setLoading(false);
        return;
      }

      try {
        const response =
          await getMySecurityReports(
            token,
          );

        setReports(response);
      } catch {
        setMessage(
          'Unable to load your safety reports.',
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const openCount =
    useMemo(
      () =>
        reports.filter(
          (report) =>
            report.status !==
              'RESOLVED' &&
            report.status !==
              'CLOSED',
        ).length,
      [reports],
    );

  return (
    <main className="security-page">
      <header className="security-header">
        <div>
          <div className="security-eyebrow">
            TRUST & SAFETY
          </div>

          <h1>Safety Centre</h1>

          <p>
            Review your safety activity and
            report behaviour or content that
            needs attention.
          </p>
        </div>

        <Link href="/settings">
          Account settings
        </Link>
      </header>

      <section className="security-hero">
        <div>
          <span>YOUR SAFETY ACTIVITY</span>

          <h2>
            Help keep your neighbourhood
            trusted.
          </h2>

          <p>
            Neighbour™ combines contextual
            reporting with a central record of
            reports you have submitted.
          </p>
        </div>

        <div className="security-hero-stats">
          <div>
            <strong>
              {reports.length}
            </strong>

            <span>Total reports</span>
          </div>

          <div>
            <strong>
              {openCount}
            </strong>

            <span>Open</span>
          </div>
        </div>
      </section>

      <section className="security-layout">
        <div className="security-main">
          <section className="security-reports">
            <div className="security-section-heading">
              <span>YOUR REPORTS</span>

              <h2>
                Report history
              </h2>

              <p>
                Reports submitted from this
                Neighbour™ account.
              </p>
            </div>

            {loading ? (
              <div className="security-empty">
                Loading reports…
              </div>
            ) : reports.length ===
              0 ? (
              <div className="security-empty">
                <div>◇</div>

                <strong>
                  No reports submitted
                </strong>

                <p>
                  Your submitted reports will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="security-report-list">
                {reports.map(
                  (report) => (
                    <article
                      key={report.id}
                      className="security-report"
                    >
                      <div className="security-report-icon">
                        ◇
                      </div>

                      <div>
                        <div className="security-report-heading">
                          <strong>
                            {report.reason}
                          </strong>

                          <span>
                            {report.status}
                          </span>
                        </div>

                        <p>
                          Safety report submitted
                          to Neighbour™.
                        </p>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          <CreateReportForm />
        </div>

        <aside className="security-rail">
          <section className="security-rail-card">
            <span>CONTEXTUAL REPORTING</span>

            <h3>
              Report where it happens
            </h3>

            <p>
              Messages and supported community
              content expose Report controls
              directly in context. That is the
              preferred route because Neighbour™
              already knows the target.
            </p>
          </section>

          <section className="security-rail-card">
            <span>WHAT TO REPORT</span>

            <div className="security-guidance">
              <div>
                <strong>
                  Harmful behaviour
                </strong>

                <p>
                  Threats, harassment or abuse.
                </p>
              </div>

              <div>
                <strong>
                  Unsafe content
                </strong>

                <p>
                  Content that may put others at
                  risk.
                </p>
              </div>

              <div>
                <strong>
                  Community concerns
                </strong>

                <p>
                  Misuse of Neighbour™ community
                  features.
                </p>
              </div>
            </div>
          </section>

          <section className="security-note">
            <strong>
              Neighbour™ safety
            </strong>

            <p>
              Reports create a moderation record.
              They are not emergency-service
              requests.
            </p>
          </section>
        </aside>
      </section>

      {message ? (
        <div
          role="status"
          className="security-message"
        >
          {message}
        </div>
      ) : null}

      <style>{`
        .security-page {
          width: min(100% - 48px,1200px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .security-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 25px;
        }

        .security-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .security-header h1 {
          margin: 0;
          color: #102019;
          font-size:
            clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .security-header p {
          max-width: 670px;
          margin: 8px 0 0;
          color: #75827c;
          font-size: 13px;
        }

        .security-header a {
          padding: 11px 15px;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 9px;
          font-weight: 800;
        }

        .security-hero {
          display: grid;
          grid-template-columns:
            minmax(0,1fr) auto;
          gap: 25px;
          align-items: center;
          padding: 24px;
          border-radius: 21px;
          background:
            linear-gradient(
              120deg,
              #09182a,
              #143554
            );
          color: #fff;
        }

        .security-hero > div:first-child > span {
          color: #8edcb9;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .security-hero h2 {
          margin: 7px 0 0;
          font-size: 23px;
        }

        .security-hero p {
          max-width: 620px;
          margin: 7px 0 0;
          color:
            rgba(255,255,255,.63);
          font-size: 9px;
          line-height: 1.55;
        }

        .security-hero-stats {
          display: grid;
          grid-template-columns:
            repeat(2,90px);
          gap: 8px;
        }

        .security-hero-stats > div {
          padding: 13px;
          border-radius: 12px;
          background:
            rgba(255,255,255,.08);
          text-align: center;
        }

        .security-hero-stats strong,
        .security-hero-stats span {
          display: block;
        }

        .security-hero-stats strong {
          font-size: 20px;
        }

        .security-hero-stats span {
          margin-top: 3px;
          color:
            rgba(255,255,255,.57);
          font-size: 7px;
        }

        .security-layout {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            280px;
          gap: 14px;
          margin-top: 18px;
          align-items: start;
        }

        .security-main,
        .security-rail {
          display: grid;
          gap: 13px;
        }

        .security-reports,
        .security-rail-card,
        .security-note {
          padding: 20px;
          border: 1px solid #e1e7e3;
          border-radius: 17px;
          background: #fff;
        }

        .security-section-heading > span,
        .security-rail-card > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .security-section-heading h2 {
          margin: 6px 0 0;
          font-size: 18px;
        }

        .security-section-heading p,
        .security-rail-card > p {
          margin: 5px 0 0;
          color: #7b8881;
          font-size: 9px;
          line-height: 1.5;
        }

        .security-report-list {
          display: grid;
          gap: 8px;
          margin-top: 15px;
        }

        .security-report {
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr);
          gap: 10px;
          align-items: center;
          padding: 13px;
          border-radius: 12px;
          background: #f7f9f8;
        }

        .security-report-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #e7f3ed;
          color: #08704a;
        }

        .security-report-heading {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }

        .security-report-heading strong {
          color: #2d4238;
          font-size: 10px;
        }

        .security-report-heading span {
          padding: 4px 6px;
          border-radius: 999px;
          background: #e7f3ed;
          color: #08704a;
          font-size: 7px;
          font-weight: 800;
        }

        .security-report p {
          margin: 4px 0 0;
          color: #7d8983;
          font-size: 8px;
        }

        .security-empty {
          margin-top: 14px;
          padding: 30px 15px;
          border-radius: 13px;
          background: #f7f9f8;
          text-align: center;
          color: #77847d;
          font-size: 9px;
        }

        .security-empty > div {
          color: #08704a;
          font-size: 20px;
        }

        .security-empty strong {
          display: block;
          margin-top: 6px;
          color: #30453b;
        }

        .security-empty p {
          margin: 4px 0 0;
        }

        .security-rail-card h3 {
          margin: 7px 0 0;
          font-size: 15px;
        }

        .security-guidance {
          display: grid;
          gap: 9px;
          margin-top: 13px;
        }

        .security-guidance > div {
          padding: 11px;
          border-radius: 10px;
          background: #f7f9f8;
        }

        .security-guidance strong {
          color: #30453b;
          font-size: 9px;
        }

        .security-guidance p {
          margin: 3px 0 0;
          color: #7d8983;
          font-size: 8px;
        }

        .security-note {
          background: #edf6f1;
        }

        .security-note strong {
          color: #175b3e;
          font-size: 9px;
        }

        .security-note p {
          margin: 4px 0 0;
          color: #648074;
          font-size: 8px;
          line-height: 1.5;
        }

        .security-message {
          margin-top: 13px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #fff6d9;
          color: #66531a;
          font-size: 9px;
        }

        @media (max-width: 830px) {
          .security-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .security-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .security-header,
          .security-hero {
            align-items: flex-start;
            grid-template-columns: 1fr;
          }

          .security-header {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
