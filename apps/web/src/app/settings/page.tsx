'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';

import { getCurrentUser, type AuthUser } from '@neighbour/api-client';

import { deleteAccount, getAccessToken, logout } from '../../lib/auth';

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState<'logout' | 'delete' | null>(null);

  const [message, setMessage] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      if (!getAccessToken()) {
        window.location.replace('/auth');
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          setMessage('We could not load your account details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAccount();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    setAction('logout');
    setMessage('');

    try {
      await logout();
    } catch {
      setAction(null);

      setMessage('Unable to sign out. Please try again.');
    }
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);

      setMessage('Account deletion is permanent. Select Delete account permanently to confirm.');

      return;
    }

    setAction('delete');
    setMessage('');

    try {
      await deleteAccount();
    } catch {
      setAction(null);
      setConfirmDelete(false);

      setMessage('Unable to delete your account. Please try again.');
    }
  }

  if (loading) {
    return (
      <main className="settings-loading">
        Loading account settings…
        <style>{`
          .settings-loading {
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

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div>
          <div className="settings-eyebrow">YOUR ACCOUNT</div>

          <h1>Settings</h1>

          <p>Manage your Neighbour™ account, session, safety and privacy.</p>
        </div>

        <div className="settings-session-state">
          <span />
          Session active
        </div>
      </header>

      <section className="settings-identity">
        <div className="settings-avatar">{user?.displayName?.slice(0, 2).toUpperCase() || 'N'}</div>

        <div>
          <span>NEIGHBOUR™ ACCOUNT</span>

          <h2>{user?.displayName ?? 'Neighbour'}</h2>

          <p>{user?.email ?? 'Account information unavailable'}</p>
        </div>

        <div className="settings-account-state">
          <strong>{user?.status ?? 'Unknown'}</strong>

          <span>Status</span>
        </div>
      </section>

      <section className="settings-layout">
        <div className="settings-main">
          <section className="settings-card">
            <div className="settings-card-heading">
              <span>ACCOUNT</span>

              <h2>Account information</h2>

              <p>Core account details attached to your Neighbour™ identity.</p>
            </div>

            {user ? (
              <div className="settings-account-grid">
                <div>
                  <span>Display name</span>

                  <strong>{user.displayName}</strong>
                </div>

                <div>
                  <span>Email</span>

                  <strong>{user.email}</strong>
                </div>

                <div>
                  <span>Account status</span>

                  <strong>{user.status}</strong>
                </div>

                <div>
                  <span>Account role</span>

                  <strong>{user.role}</strong>
                </div>
              </div>
            ) : (
              <p className="settings-muted">Account information is unavailable.</p>
            )}
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <span>YOUR EXPERIENCE</span>

              <h2>Profile & safety</h2>

              <p>Manage your public identity and review your Trust & Safety activity.</p>
            </div>

            <div className="settings-links">
              <Link href="/profile/setup">
                <div className="settings-link-icon">◎</div>

                <section>
                  <strong>Profile</strong>

                  <span>Manage your public Neighbour™ identity.</span>
                </section>

                <b>→</b>
              </Link>

              <Link href="/security">
                <div className="settings-link-icon">◇</div>

                <section>
                  <strong>Trust & Safety</strong>

                  <span>Review reports and access safety tools.</span>
                </section>

                <b>→</b>
              </Link>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <span>SESSION</span>

              <h2>Sign out</h2>

              <p>End this browser session and return to the Neighbour™ sign-in screen.</p>
            </div>

            <button
              type="button"
              className="settings-signout"
              disabled={action !== null}
              onClick={() => void handleLogout()}
            >
              {action === 'logout' ? 'Signing out…' : 'Sign out of Neighbour™'}
            </button>
          </section>
        </div>

        <aside className="settings-rail">
          <section className="settings-rail-card">
            <span>ACCOUNT SECURITY</span>

            <h3>Your session</h3>

            <p>
              Neighbour™ automatically refreshes your authenticated web session while valid
              credentials remain available.
            </p>

            <div className="settings-live-row">
              <span />
              Authenticated
            </div>
          </section>

          <section className="settings-rail-card">
            <span>PRIVACY</span>

            <h3>Profile controls</h3>

            <p>Your local-area visibility can be managed from your Profile page.</p>

            <Link href="/profile/setup">Open profile →</Link>
          </section>
        </aside>
      </section>

      <section className="settings-danger">
        <div>
          <span>DANGER ZONE</span>

          <h2>Delete account</h2>

          <p>Permanently delete your Neighbour™ account. This action cannot be reversed.</p>
        </div>

        <div className="settings-danger-actions">
          <button
            type="button"
            disabled={action !== null}
            onClick={() => void handleDeleteAccount()}
          >
            {action === 'delete'
              ? 'Deleting account…'
              : confirmDelete
                ? 'Delete account permanently'
                : 'Delete account'}
          </button>

          {confirmDelete && action === null ? (
            <button
              type="button"
              className="settings-cancel-delete"
              onClick={() => {
                setConfirmDelete(false);

                setMessage('');
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </section>

      {message ? (
        <div role="status" aria-live="polite" className="settings-message">
          {message}
        </div>
      ) : null}

      <style>{`
        .settings-page {
          width: min(100% - 48px,1200px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .settings-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 25px;
        }

        .settings-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .settings-header h1 {
          margin: 0;
          color: #102019;
          font-size:
            clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .settings-header p {
          margin: 8px 0 0;
          color: #75827c;
          font-size: 13px;
        }

        .settings-session-state {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #607168;
          font-size: 9px;
          font-weight: 800;
        }

        .settings-session-state > span,
        .settings-live-row > span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #31bf76;
        }

        .settings-identity {
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr) auto;
          align-items: center;
          gap: 15px;
          padding: 22px;
          border-radius: 21px;
          background:
            linear-gradient(
              120deg,
              #09182a,
              #143554
            );
          color: #fff;
        }

        .settings-avatar {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: #0c754e;
          font-size: 16px;
          font-weight: 850;
        }

        .settings-identity > div:nth-child(2) > span {
          color: #8edcb9;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .settings-identity h2 {
          margin: 5px 0 0;
          font-size: 20px;
        }

        .settings-identity p {
          margin: 4px 0 0;
          color:
            rgba(255,255,255,.63);
          font-size: 9px;
        }

        .settings-account-state {
          text-align: right;
        }

        .settings-account-state strong,
        .settings-account-state span {
          display: block;
        }

        .settings-account-state strong {
          font-size: 11px;
        }

        .settings-account-state span {
          margin-top: 3px;
          color:
            rgba(255,255,255,.57);
          font-size: 8px;
        }

        .settings-layout {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            280px;
          gap: 15px;
          margin-top: 20px;
          align-items: start;
        }

        .settings-main,
        .settings-rail {
          display: grid;
          gap: 13px;
        }

        .settings-card,
        .settings-rail-card {
          padding: 20px;
          border: 1px solid #e1e7e3;
          border-radius: 17px;
          background: #fff;
        }

        .settings-card-heading > span,
        .settings-rail-card > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .settings-card-heading h2 {
          margin: 6px 0 0;
          font-size: 18px;
        }

        .settings-card-heading p,
        .settings-rail-card p {
          margin: 5px 0 0;
          color: #7b8881;
          font-size: 9px;
          line-height: 1.5;
        }

        .settings-account-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 9px;
          margin-top: 16px;
        }

        .settings-account-grid > div {
          padding: 13px;
          border-radius: 12px;
          background: #f7f9f8;
        }

        .settings-account-grid span,
        .settings-account-grid strong {
          display: block;
        }

        .settings-account-grid span {
          color: #8b9791;
          font-size: 8px;
        }

        .settings-account-grid strong {
          margin-top: 5px;
          overflow-wrap: anywhere;
          color: #263b31;
          font-size: 10px;
        }

        .settings-links {
          display: grid;
          gap: 8px;
          margin-top: 15px;
        }

        .settings-links > a {
          display: grid;
          grid-template-columns:
            auto minmax(0,1fr) auto;
          gap: 11px;
          align-items: center;
          padding: 13px;
          border-radius: 12px;
          background: #f7f9f8;
          color: inherit;
          text-decoration: none;
        }

        .settings-link-icon {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #e7f3ed;
          color: #08704a;
        }

        .settings-links strong,
        .settings-links span {
          display: block;
        }

        .settings-links strong {
          color: #2d4238;
          font-size: 10px;
        }

        .settings-links span {
          margin-top: 3px;
          color: #7d8983;
          font-size: 8px;
        }

        .settings-links b {
          color: #8b9791;
          font-size: 11px;
        }

        .settings-signout {
          margin-top: 14px;
          padding: 10px 14px;
          border: 1px solid #0a6945;
          border-radius: 10px;
          background: #fff;
          color: #0a6945;
          font: inherit;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .settings-rail-card h3 {
          margin: 7px 0 0;
          font-size: 15px;
        }

        .settings-live-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 13px;
          color: #496158;
          font-size: 8px;
          font-weight: 800;
        }

        .settings-rail-card a {
          display: inline-block;
          margin-top: 11px;
          color: #08704a;
          font-size: 8px;
          font-weight: 800;
        }

        .settings-danger {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          margin-top: 16px;
          padding: 20px;
          border: 1px solid #f0c5c1;
          border-radius: 17px;
          background: #fff9f8;
        }

        .settings-danger > div:first-child > span {
          color: #b42318;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .settings-danger h2 {
          margin: 6px 0 0;
          color: #5c1c16;
          font-size: 17px;
        }

        .settings-danger p {
          margin: 5px 0 0;
          color: #8c5d58;
          font-size: 9px;
        }

        .settings-danger-actions {
          display: flex;
          gap: 7px;
          flex-shrink: 0;
        }

        .settings-danger-actions button {
          padding: 10px 13px;
          border: 0;
          border-radius: 10px;
          background: #b42318;
          color: #fff;
          font: inherit;
          font-size: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .settings-danger-actions
          .settings-cancel-delete {
          border: 1px solid #d8dfdb;
          background: #fff;
          color: #4c5d55;
        }

        .settings-message {
          margin-top: 13px;
          padding: 11px 13px;
          border-radius: 11px;
          background: #fff6d9;
          color: #66531a;
          font-size: 9px;
        }

        @media (max-width: 830px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .settings-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .settings-header,
          .settings-danger {
            align-items: flex-start;
            flex-direction: column;
          }

          .settings-account-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
