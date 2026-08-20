'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  getMyProfile,
  updateMyProfile,
  type PrivateProfile,
} from '@neighbour/api-client';

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<PrivateProfile | null>(
      null,
    );

  const [username, setUsername] =
    useState('');

  const [localArea, setLocalArea] =
    useState('');

  const [bio, setBio] =
    useState('');

  const [
    showLocalArea,
    setShowLocalArea,
  ] = useState(true);

  const [message, setMessage] =
    useState('Loading your profile…');

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    async function load() {
      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        setMessage(
          'No active session.',
        );
        return;
      }

      try {
        const current =
          await getMyProfile(token);

        setProfile(current);
        setUsername(
          current.username ?? '',
        );
        setLocalArea(
          current.localArea ?? '',
        );
        setBio(
          current.bio ?? '',
        );
        setShowLocalArea(
          current.showLocalArea,
        );
        setMessage('');
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load profile.',
        );
      }
    }

    void load();
  }, []);

  async function saveProfile() {
    const token =
      localStorage.getItem('accessToken');

    if (!token || busy) {
      return;
    }

    setBusy(true);
    setMessage(
      'Saving your profile…',
    );

    try {
      const updated =
        await updateMyProfile(
          {
            username:
              username.trim(),
            localArea:
              localArea.trim(),
            bio: bio.trim(),
            showLocalArea,
          },
          token,
        );

      setProfile(updated);
      setMessage(
        'Profile saved successfully.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Profile save failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  const initials =
    profile?.displayName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase(),
      )
      .join('') || 'N';

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <div className="profile-eyebrow">
            YOUR NEIGHBOUR™ IDENTITY
          </div>

          <h1>Profile</h1>

          <p>
            Manage how you appear to neighbours
            across the Neighbour™ network.
          </p>
        </div>

        <div className="profile-status">
          <span />
          Profile active
        </div>
      </header>

      <section className="profile-layout">
        <aside className="profile-preview">
          <div className="profile-preview-top">
            <div className="profile-avatar">
              {initials}
            </div>

            <div>
              <div className="profile-preview-label">
                YOUR PROFILE
              </div>

              <h2>
                {profile?.displayName ??
                  'Neighbour'}
              </h2>

              <p>
                @{username ||
                  profile?.username ||
                  'neighbour'}
              </p>
            </div>
          </div>

          <div className="profile-local-badge">
            ⌖{' '}
            {localArea ||
              'Local area not set'}
          </div>

          <div className="profile-bio-preview">
            {bio ||
              'Tell your neighbours a little about yourself.'}
          </div>

          <div className="profile-preview-grid">
            <div>
              <strong>
                {showLocalArea
                  ? 'Visible'
                  : 'Private'}
              </strong>
              <span>Local area</span>
            </div>

            <div>
              <strong>Live</strong>
              <span>Profile</span>
            </div>
          </div>

          <div className="profile-safety">
            <strong>
              Your privacy
            </strong>

            <p>
              You control whether your local area
              appears on your profile.
            </p>
          </div>
        </aside>

        <section className="profile-editor">
          <div className="profile-editor-header">
            <div>
              <span>EDIT PROFILE</span>

              <h2>
                Your public information
              </h2>

              <p>
                Keep your Neighbour™ identity
                current and useful.
              </p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              <span>Username</span>

              <input
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value,
                  )
                }
                placeholder="Username"
              />
            </label>

            <label>
              <span>Local area</span>

              <input
                value={localArea}
                onChange={(event) =>
                  setLocalArea(
                    event.target.value,
                  )
                }
                placeholder="Your local area"
              />
            </label>
          </div>

          <label className="profile-bio-field">
            <span>About you</span>

            <textarea
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value,
                )
              }
              placeholder="Tell your neighbours about yourself"
            />

            <small>
              A short introduction helps local
              neighbours know who they’re
              connecting with.
            </small>
          </label>

          <div className="profile-privacy-row">
            <div>
              <strong>
                Show local area
              </strong>

              <p>
                Allow your local area to appear
                on your public profile.
              </p>
            </div>

            <button
              type="button"
              className={
                showLocalArea
                  ? 'profile-toggle profile-toggle-on'
                  : 'profile-toggle'
              }
              aria-pressed={
                showLocalArea
              }
              onClick={() =>
                setShowLocalArea(
                  (current) =>
                    !current,
                )
              }
            >
              <span />
            </button>
          </div>

          {message ? (
            <div className="profile-message">
              {message}
            </div>
          ) : null}

          <div className="profile-actions">
            <button
              type="button"
              disabled={
                busy ||
                !profile ||
                !username.trim()
              }
              onClick={() =>
                void saveProfile()
              }
            >
              {busy
                ? 'Saving…'
                : 'Save profile'}
            </button>
          </div>
        </section>
      </section>

      <style>{`
        .profile-page {
          width: min(100% - 48px,1200px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 26px;
        }

        .profile-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .profile-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .profile-header p {
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
        }

        .profile-status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #607168;
          font-size: 10px;
          font-weight: 750;
        }

        .profile-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2dbf75;
        }

        .profile-layout {
          display: grid;
          grid-template-columns:
            340px minmax(0,1fr);
          gap: 20px;
          align-items: start;
        }

        .profile-preview,
        .profile-editor {
          border: 1px solid
            rgba(18,48,38,.07);
          border-radius: 22px;
          background: #fff;
          box-shadow:
            0 15px 40px
            rgba(19,45,34,.045);
        }

        .profile-preview {
          padding: 22px;
        }

        .profile-preview-top {
          display: flex;
          gap: 13px;
          align-items: center;
        }

        .profile-avatar {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 19px;
          background:
            linear-gradient(
              145deg,
              #0a714b,
              #06452f
            );
          color: #fff;
          font-size: 18px;
          font-weight: 850;
        }

        .profile-preview-label {
          color: #8e9a94;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .profile-preview h2 {
          margin: 5px 0 0;
          color: #102019;
          font-size: 20px;
        }

        .profile-preview-top p {
          margin: 4px 0 0;
          color: #74817b;
          font-size: 10px;
        }

        .profile-local-badge {
          margin-top: 20px;
          padding: 10px 11px;
          border-radius: 11px;
          background: #f3f8f5;
          color: #315346;
          font-size: 10px;
          font-weight: 750;
        }

        .profile-bio-preview {
          min-height: 54px;
          margin-top: 15px;
          color: #66766e;
          font-size: 11px;
          line-height: 1.55;
        }

        .profile-preview-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 8px;
          margin-top: 18px;
        }

        .profile-preview-grid div {
          padding: 11px;
          border-radius: 12px;
          background: #f7f9f8;
        }

        .profile-preview-grid strong {
          display: block;
          color: #086240;
          font-size: 12px;
        }

        .profile-preview-grid span {
          display: block;
          margin-top: 3px;
          color: #8f9a94;
          font-size: 8px;
        }

        .profile-safety {
          margin-top: 18px;
          padding: 14px;
          border-radius: 13px;
          background: #eef6f2;
        }

        .profile-safety strong {
          color: #145a3e;
          font-size: 10px;
        }

        .profile-safety p {
          margin: 4px 0 0;
          color: #687970;
          font-size: 9px;
          line-height: 1.5;
        }

        .profile-editor {
          padding: 26px;
        }

        .profile-editor-header span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .profile-editor-header h2 {
          margin: 6px 0 0;
          color: #102019;
          font-size: 22px;
        }

        .profile-editor-header p {
          margin: 5px 0 0;
          color: #7c8882;
          font-size: 10px;
        }

        .profile-form-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 13px;
          margin-top: 24px;
        }

        .profile-editor label {
          display: grid;
          gap: 7px;
        }

        .profile-editor label > span {
          color: #405249;
          font-size: 10px;
          font-weight: 800;
        }

        .profile-editor input,
        .profile-editor textarea {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #dce4df;
          border-radius: 12px;
          outline: 0;
          background: #fbfcfb;
          color: #102019;
          font: inherit;
          font-size: 12px;
        }

        .profile-editor input {
          min-height: 44px;
          padding: 0 12px;
        }

        .profile-bio-field {
          margin-top: 16px;
        }

        .profile-editor textarea {
          min-height: 130px;
          resize: vertical;
          padding: 12px;
        }

        .profile-bio-field small {
          color: #949f99;
          font-size: 8px;
        }

        .profile-privacy-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 20px;
          padding: 16px;
          border-radius: 14px;
          background: #f7f9f8;
        }

        .profile-privacy-row strong {
          color: #2c4137;
          font-size: 10px;
        }

        .profile-privacy-row p {
          margin: 4px 0 0;
          color: #7c8982;
          font-size: 9px;
        }

        .profile-toggle {
          width: 46px;
          height: 25px;
          flex: 0 0 46px;
          padding: 3px;
          border: 0;
          border-radius: 999px;
          background: #cad3ce;
          cursor: pointer;
        }

        .profile-toggle span {
          display: block;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #fff;
          transition:
            transform .15s ease;
        }

        .profile-toggle-on {
          background: #08704a;
        }

        .profile-toggle-on span {
          transform:
            translateX(21px);
        }

        .profile-message {
          margin-top: 16px;
          padding: 11px 13px;
          border-radius: 11px;
          background: #f2f6f4;
          color: #53675e;
          font-size: 9px;
        }

        .profile-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 18px;
        }

        .profile-actions button {
          min-width: 140px;
          min-height: 42px;
          border: 0;
          border-radius: 12px;
          background: #086240;
          color: #fff;
          font: inherit;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .profile-actions button:disabled {
          opacity: .5;
          cursor: default;
        }

        @media (max-width: 880px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .profile-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .profile-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
