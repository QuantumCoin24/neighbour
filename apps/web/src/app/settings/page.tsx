'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import {
  getCurrentUser,
  type AuthUser,
} from '@neighbour/api-client';

import {
  deleteAccount,
  getAccessToken,
  logout,
} from '../../lib/auth';

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] =
    useState<'logout' | 'delete' | null>(null);
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
      setMessage(
        'This permanently deletes your Neighbour™ account. Select Delete account again to confirm.',
      );
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
      <main style={styles.page}>
        <section style={styles.card}>
          <p style={styles.eyebrow}>ACCOUNT</p>
          <h1 style={styles.heading}>Settings</h1>
          <p style={styles.muted}>Loading your account…</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>ACCOUNT</p>

          <h1 style={styles.heading}>
            Settings
          </h1>

          <p style={styles.muted}>
            Manage your Neighbour™ account and session.
          </p>
        </header>

        <section style={styles.card}>
          <h2 style={styles.sectionHeading}>
            Your account
          </h2>

          {user ? (
            <div style={styles.accountGrid}>
              <div style={styles.field}>
                <span style={styles.label}>
                  Display name
                </span>
                <strong>{user.displayName}</strong>
              </div>

              <div style={styles.field}>
                <span style={styles.label}>
                  Email
                </span>
                <strong>{user.email}</strong>
              </div>

              <div style={styles.field}>
                <span style={styles.label}>
                  Status
                </span>
                <strong>{user.status}</strong>
              </div>

              <div style={styles.field}>
                <span style={styles.label}>
                  Role
                </span>
                <strong>{user.role}</strong>
              </div>
            </div>
          ) : (
            <p style={styles.muted}>
              Account information is unavailable.
            </p>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionHeading}>
            Session
          </h2>

          <p style={styles.muted}>
            Sign out of Neighbour™ on this browser.
          </p>

          <button
            type="button"
            disabled={action !== null}
            onClick={() => void handleLogout()}
            style={styles.secondaryButton}
          >
            {action === 'logout'
              ? 'Signing out…'
              : 'Sign out'}
          </button>
        </section>

        <section style={styles.dangerCard}>
          <p style={styles.dangerEyebrow}>
            DANGER ZONE
          </p>

          <h2 style={styles.sectionHeading}>
            Delete account
          </h2>

          <p style={styles.muted}>
            Permanently delete your Neighbour™ account.
            This action cannot be undone.
          </p>

          <button
            type="button"
            disabled={action !== null}
            onClick={() => void handleDeleteAccount()}
            style={styles.dangerButton}
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
              onClick={() => {
                setConfirmDelete(false);
                setMessage('');
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          ) : null}
        </section>

        {message ? (
          <div
            role="status"
            aria-live="polite"
            style={styles.message}
          >
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: '48px 24px 120px',
    boxSizing: 'border-box',
  },

  container: {
    width: '100%',
    maxWidth: '860px',
    margin: '0 auto',
  },

  header: {
    marginBottom: '24px',
  },

  eyebrow: {
    margin: '0 0 8px',
    color: '#0E5B3A',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  dangerEyebrow: {
    margin: '0 0 8px',
    color: '#B42318',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.12em',
  },

  heading: {
    margin: 0,
    color: '#102019',
    fontSize: '38px',
    letterSpacing: '-0.04em',
  },

  sectionHeading: {
    margin: '0 0 10px',
    color: '#102019',
    fontSize: '21px',
  },

  muted: {
    color: '#64748B',
    lineHeight: 1.6,
  },

  card: {
    padding: '26px',
    marginBottom: '18px',
    border: '1px solid #E2E8E4',
    borderRadius: '22px',
    background: '#FFFFFF',
    boxShadow: '0 10px 32px rgba(6,63,42,.05)',
  },

  dangerCard: {
    padding: '26px',
    marginBottom: '18px',
    border: '1px solid #F3C7C3',
    borderRadius: '22px',
    background: '#FFF9F8',
  },

  accountGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginTop: '18px',
  },

  field: {
    padding: '16px',
    borderRadius: '16px',
    background: '#F7FAF8',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  label: {
    color: '#64748B',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },

  secondaryButton: {
    marginTop: '10px',
    padding: '12px 18px',
    border: '1px solid #0E5B3A',
    borderRadius: '14px',
    background: '#FFFFFF',
    color: '#0E5B3A',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  dangerButton: {
    marginTop: '10px',
    marginRight: '10px',
    padding: '12px 18px',
    border: 0,
    borderRadius: '14px',
    background: '#B42318',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  cancelButton: {
    marginTop: '10px',
    padding: '12px 18px',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    background: '#FFFFFF',
    color: '#334155',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  message: {
    padding: '16px 18px',
    borderRadius: '16px',
    background: '#FFF7D6',
    color: '#5F4B00',
    lineHeight: 1.5,
  },
};
