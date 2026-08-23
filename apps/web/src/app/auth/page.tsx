'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';

import { loginUser, registerUser } from '@neighbour/api-client';

import { saveTokens } from '../../lib/auth';

export default function AuthPage() {
  const [mode, setMode] = useState<'register' | 'login'>('login');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (busy) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const response =
        mode === 'register'
          ? await registerUser({
              displayName,
              email,
              password,
            })
          : await loginUser({
              email,
              password,
            });

      saveTokens(response.accessToken, response.refreshToken);

      window.location.href = mode === 'register' ? '/profile/setup' : '/home';
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');

      setBusy(false);
    }
  }

  const loginMode = mode === 'login';

  return (
    <main className="neighbour-auth-page">
      <section className="neighbour-auth-story">
        <div className="neighbour-auth-brand">
          <img src="/brand/neighbour-mark.svg" alt="Neighbour" width={54} height={54} />

          <div>
            <div className="neighbour-auth-wordmark">Neighbour™</div>

            <div className="neighbour-auth-tagline">Stronger together. Local forever.</div>
          </div>
        </div>

        <div className="neighbour-auth-story-copy">
          <div className="neighbour-auth-eyebrow">YOUR NEIGHBOURHOOD, CONNECTED</div>

          <h1>
            Local life,
            <br />
            in one place.
          </h1>

          <p>
            Connect with neighbours, discover what is happening nearby and build a stronger local
            community.
          </p>

          <div className="neighbour-auth-points">
            <div>
              <span>⌂</span>
              <strong>Know what is happening nearby</strong>
            </div>

            <div>
              <span>◎</span>
              <strong>Connect with real local people</strong>
            </div>

            <div>
              <span>◇</span>
              <strong>Stay informed and feel connected</strong>
            </div>
          </div>
        </div>

        <div className="neighbour-auth-story-footer">
          Neighbour™ · Built for real neighbourhoods.
        </div>
      </section>

      <section className="neighbour-auth-panel">
        <div className="neighbour-auth-mobile-brand">
          <img src="/brand/neighbour-mark.svg" alt="" width={42} height={42} />

          <strong>Neighbour™</strong>
        </div>

        <div className="neighbour-auth-card">
          <div className="neighbour-auth-card-header">
            <div className="neighbour-auth-card-mark">
              {loginMode ? 'Welcome back' : 'Join Neighbour™'}
            </div>

            <h2>{loginMode ? 'Sign in to your neighbourhood' : 'Create your local account'}</h2>

            <p>{loginMode ? 'Continue where you left off.' : 'Your neighbourhood is waiting.'}</p>
          </div>

          <form onSubmit={(event) => void handleSubmit(event)}>
            {!loginMode ? (
              <label style={styles.field}>
                <span style={styles.label}>Display name</span>

                <input
                  autoComplete="name"
                  placeholder="How neighbours will know you"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  style={styles.input}
                />
              </label>
            ) : null}

            <label style={styles.field}>
              <span style={styles.label}>Email address</span>

              <input
                autoComplete="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={styles.input}
                required
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Password</span>

              <input
                autoComplete={loginMode ? 'current-password' : 'new-password'}
                placeholder="Your password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={styles.input}
                required
              />
            </label>

            <button type="submit" disabled={busy} className="neighbour-auth-primary">
              {busy
                ? loginMode
                  ? 'Signing in…'
                  : 'Creating account…'
                : loginMode
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>

          {message ? (
            <div role="status" aria-live="polite" className="neighbour-auth-message">
              {message}
            </div>
          ) : null}

          <div className="neighbour-auth-divider">
            <span />
            <p>or</p>
            <span />
          </div>

          <button
            type="button"
            className="neighbour-auth-secondary"
            onClick={() => {
              setMode(loginMode ? 'register' : 'login');
              setMessage('');
            }}
          >
            {loginMode ? 'Create a new Neighbour™ account' : 'Already have an account? Sign in'}
          </button>

          <p className="neighbour-auth-smallprint">
            By continuing, you are joining a community built around local connection, trust and
            safety.
          </p>
        </div>
      </section>

      <style>{`
        .neighbour-auth-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns:
            minmax(380px, .92fr)
            minmax(520px, 1.08fr);
          background: #f7f5f0;
        }

        .neighbour-auth-story {
          min-height: 100vh;
          box-sizing: border-box;
          padding: 46px 56px 38px;
          display: flex;
          flex-direction: column;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 15% 8%,
              rgba(65,190,129,.22),
              transparent 34%
            ),
            linear-gradient(
              145deg,
              #06452f 0%,
              #043b29 50%,
              #032f22 100%
            );
          overflow: hidden;
          position: relative;
        }

        .neighbour-auth-story::after {
          content: '';
          position: absolute;
          width: 420px;
          height: 420px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 50%;
          right: -210px;
          bottom: -130px;
          box-shadow:
            0 0 0 70px rgba(255,255,255,.025),
            0 0 0 140px rgba(255,255,255,.018);
        }

        .neighbour-auth-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
          z-index: 1;
        }

        .neighbour-auth-wordmark {
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -.6px;
        }

        .neighbour-auth-tagline {
          margin-top: 3px;
          color: #a7f3d0;
          font-size: 12px;
          font-weight: 700;
        }

        .neighbour-auth-story-copy {
          margin: auto 0;
          max-width: 550px;
          position: relative;
          z-index: 1;
        }

        .neighbour-auth-eyebrow {
          color: #93e6bd;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .16em;
        }

        .neighbour-auth-story h1 {
          margin: 18px 0 20px;
          font-size: clamp(48px, 5.5vw, 76px);
          line-height: .98;
          letter-spacing: -.055em;
        }

        .neighbour-auth-story-copy > p {
          max-width: 470px;
          color: rgba(255,255,255,.72);
          font-size: 17px;
          line-height: 1.65;
        }

        .neighbour-auth-points {
          display: grid;
          gap: 13px;
          margin-top: 34px;
        }

        .neighbour-auth-points div {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,.88);
          font-size: 14px;
        }

        .neighbour-auth-points span {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: rgba(255,255,255,.09);
          color: #a7f3d0;
        }

        .neighbour-auth-story-footer {
          position: relative;
          z-index: 1;
          color: rgba(255,255,255,.4);
          font-size: 11px;
        }

        .neighbour-auth-panel {
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 52px;
          background:
            radial-gradient(
              circle at 72% 18%,
              rgba(6,69,47,.06),
              transparent 28%
            ),
            #f7f5f0;
        }

        .neighbour-auth-mobile-brand {
          display: none;
        }

        .neighbour-auth-card {
          width: min(100%, 470px);
          box-sizing: border-box;
          padding: 42px;
          border: 1px solid rgba(15,46,34,.08);
          border-radius: 28px;
          background: rgba(255,255,255,.94);
          box-shadow:
            0 25px 70px rgba(19,45,34,.09),
            0 2px 8px rgba(19,45,34,.03);
        }

        .neighbour-auth-card-header {
          margin-bottom: 30px;
        }

        .neighbour-auth-card-mark {
          margin-bottom: 9px;
          color: #0a6945;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: .04em;
        }

        .neighbour-auth-card h2 {
          margin: 0;
          color: #102019;
          font-size: 28px;
          line-height: 1.15;
          letter-spacing: -.035em;
        }

        .neighbour-auth-card-header p {
          margin: 10px 0 0;
          color: #718078;
          font-size: 14px;
        }

        .neighbour-auth-primary,
        .neighbour-auth-secondary {
          width: 100%;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform .16s ease,
            box-shadow .16s ease,
            background .16s ease;
        }

        .neighbour-auth-primary {
          margin-top: 8px;
          padding: 14px 18px;
          border: 0;
          background: #07583a;
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(7,88,58,.16);
        }

        .neighbour-auth-primary:hover {
          background: #064c33;
          transform: translateY(-1px);
        }

        .neighbour-auth-primary:disabled {
          opacity: .65;
          cursor: wait;
          transform: none;
        }

        .neighbour-auth-secondary {
          padding: 13px 18px;
          border: 1px solid #dfe6e1;
          background: #ffffff;
          color: #193128;
        }

        .neighbour-auth-secondary:hover {
          background: #f7faf8;
          transform: translateY(-1px);
        }

        .neighbour-auth-message {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #fff5df;
          color: #755719;
          font-size: 13px;
          line-height: 1.45;
        }

        .neighbour-auth-divider {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: center;
          margin: 23px 0;
        }

        .neighbour-auth-divider span {
          height: 1px;
          background: #e7ebe8;
        }

        .neighbour-auth-divider p {
          margin: 0;
          color: #9aa49f;
          font-size: 11px;
        }

        .neighbour-auth-smallprint {
          margin: 20px 8px 0;
          color: #9aa49f;
          text-align: center;
          font-size: 10px;
          line-height: 1.55;
        }

        @media (max-width: 900px) {
          .neighbour-auth-page {
            display: block;
          }

          .neighbour-auth-story {
            display: none;
          }

          .neighbour-auth-panel {
            min-height: 100vh;
            flex-direction: column;
            gap: 24px;
            padding: 28px 20px;
          }

          .neighbour-auth-mobile-brand {
            display: flex;
            align-items: center;
            gap: 11px;
            color: #123127;
            font-size: 19px;
          }

          .neighbour-auth-card {
            padding: 30px 24px;
            border-radius: 22px;
          }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  field: {
    display: 'grid',
    gap: '7px',
    marginBottom: '16px',
  },

  label: {
    color: '#3B5047',
    fontSize: '12px',
    fontWeight: 750,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px 14px',
    border: '1px solid #DCE4DF',
    borderRadius: '13px',
    outline: 'none',
    background: '#FBFCFB',
    color: '#102019',
    fontSize: '15px',
    fontFamily: 'inherit',
  },
};
