'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  ApiClientError,
  getMyProfile,
  resolvePostalLocation,
  updateMyProfile,
  type PrivateProfile,
} from '@neighbour/api-client';

import { uploadWebMedia, type WebPendingMedia } from '../../../lib/media/upload';

export default function ProfilePage() {
  const [profile, setProfile] = useState<PrivateProfile | null>(null);

  const [avatarUrl, setAvatarUrl] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [avatarMessage, setAvatarMessage] = useState('');

  const [username, setUsername] = useState('');

  const [localArea, setLocalArea] = useState('');

  const [countryCode, setCountryCode] = useState('');

  const [postalCode, setPostalCode] = useState('');

  const [resolvedCity, setResolvedCity] = useState<string | null>(null);

  const [resolvedRegion, setResolvedRegion] = useState<string | null>(null);

  const [resolvedLatitude, setResolvedLatitude] = useState<number | null>(null);

  const [resolvedLongitude, setResolvedLongitude] = useState<number | null>(null);

  const [resolvingLocation, setResolvingLocation] = useState(false);

  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const [bio, setBio] = useState('');

  const [showLocalArea, setShowLocalArea] = useState(true);

  const [message, setMessage] = useState('Loading your profile…');

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setMessage('No active session.');
        return;
      }

      try {
        const current = await getMyProfile(token);

        setProfile(current);
        setAvatarUrl(current.avatarUrl ?? '');
        setUsername(current.username ?? '');
        setLocalArea(current.localArea ?? '');
        setCountryCode(current.countryCode ?? '');
        setPostalCode(current.postalCode ?? '');
        setResolvedCity(current.city ?? null);
        setResolvedRegion(current.region ?? null);
        setResolvedLatitude(current.latitude ?? null);
        setResolvedLongitude(current.longitude ?? null);
        setBio(current.bio ?? '');
        setShowLocalArea(current.showLocalArea);
        setMessage('');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load profile.');
      }
    }

    void load();
  }, []);

  function clearResolvedLocation() {
    setResolvedCity(null);
    setResolvedRegion(null);
    setResolvedLatitude(null);
    setResolvedLongitude(null);
    setLocationMessage(null);
  }

  async function findLocation() {
    const nextCountryCode = countryCode.trim().toUpperCase();
    const nextPostalCode = postalCode.trim();

    if (nextCountryCode.length !== 2) {
      setLocationMessage('Enter a two-letter country code, for example GB, US or CA.');
      return;
    }

    if (!nextPostalCode) {
      setLocationMessage('Enter your postcode, ZIP or postal code.');
      return;
    }

    setResolvingLocation(true);
    setLocationMessage(null);

    try {
      const result = await resolvePostalLocation({
        countryCode: nextCountryCode,
        postalCode: nextPostalCode,
      });

      if (!result.resolved || result.latitude === null || result.longitude === null) {
        clearResolvedLocation();
        setLocationMessage(
          'Neighbour could not find that postal location. Check the country and postal code.',
        );
        return;
      }

      const publicArea = [result.city, result.region].filter(Boolean).join(', ');

      setCountryCode(result.countryCode);
      setPostalCode(result.postalCode);
      setResolvedCity(result.city);
      setResolvedRegion(result.region);
      setResolvedLatitude(result.latitude);
      setResolvedLongitude(result.longitude);

      if (publicArea) {
        setLocalArea(publicArea);
      }

      setLocationMessage(publicArea ? `Location found: ${publicArea}` : 'Location found.');
    } catch (error) {
      clearResolvedLocation();

      setLocationMessage('Neighbour could not resolve that postal location. Please try again.');

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Neighbour/WebProfile] postal location resolution failed:', error);
      }
    } finally {
      setResolvingLocation(false);
    }
  }

  const structuredLocationInput =
    resolvedLatitude !== null && resolvedLongitude !== null
      ? {
          countryCode: countryCode.trim().toUpperCase(),
          postalCode: postalCode.trim(),
          ...(resolvedCity ? { city: resolvedCity } : {}),
          ...(resolvedRegion ? { region: resolvedRegion } : {}),
          latitude: resolvedLatitude,
          longitude: resolvedLongitude,
        }
      : {};

  async function saveProfile() {
    const token = localStorage.getItem('accessToken');

    if (!token || busy) {
      return;
    }

    setBusy(true);
    setMessage('Saving your profile…');

    try {
      const updated = await updateMyProfile(
        {
          username: username.trim(),
          avatarUrl: avatarUrl.trim() || null,
          ...(localArea.trim() ? { localArea: localArea.trim() } : {}),
          ...structuredLocationInput,
          bio: bio.trim(),
          showLocalArea,
        },
        token,
      );

      setProfile(updated);
      setUsername(updated.username);
      setMessage('Profile saved successfully.');
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setMessage('That username is already in use. Try another one.');
      } else if (error instanceof ApiClientError && error.status === 400) {
        setMessage(
          'Check your profile details. Usernames use 3–30 letters, numbers, dots or underscores.',
        );
      } else {
        setMessage('Neighbour could not save your profile. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function changeProfilePhoto(file: File | null) {
    const token = localStorage.getItem('accessToken');

    if (!file || !token || uploadingAvatar) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarMessage('Choose an image file.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setAvatarMessage('Choose an image smaller than 20 MB.');
      return;
    }

    setUploadingAvatar(true);
    setAvatarMessage('Uploading profile photo…');

    try {
      const pending: WebPendingMedia = {
        localId: `profile-${Date.now()}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
      };

      const uploaded = await uploadWebMedia(pending);
      const url = uploaded.url;

      if (!url) {
        throw new Error('Uploaded profile photo does not have an asset URL.');
      }

      const updated = await updateMyProfile(
        {
          avatarUrl: url,
        },
        token,
      );

      setProfile(updated);
      setAvatarUrl(updated.avatarUrl ?? url);
      setAvatarMessage('Profile photo saved.');
    } catch (error) {
      console.error('[Neighbour/WebProfile] profile photo upload failed:', error);
      setAvatarMessage('Neighbour could not upload your profile photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeProfilePhoto() {
    const token = localStorage.getItem('accessToken');

    if (!token || uploadingAvatar) {
      return;
    }

    setUploadingAvatar(true);
    setAvatarMessage('Removing profile photo…');

    try {
      const updated = await updateMyProfile(
        {
          avatarUrl: null,
        },
        token,
      );

      setProfile(updated);
      setAvatarUrl('');
      setAvatarMessage('Profile photo removed.');
    } catch (error) {
      console.error('[Neighbour/WebProfile] profile photo removal failed:', error);
      setAvatarMessage('Neighbour could not remove your profile photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const initials =
    profile?.displayName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'N';

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <div className="profile-eyebrow">YOUR NEIGHBOUR™ IDENTITY</div>

          <h1>Profile</h1>

          <p>Manage how you appear to neighbours across the Neighbour™ network.</p>
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
              {avatarUrl ? <img src={avatarUrl} alt="Your profile" /> : initials}
            </div>

            <div>
              <div className="profile-preview-label">YOUR PROFILE</div>

              <h2>{profile?.displayName ?? 'Neighbour'}</h2>

              <p>@{username || profile?.username || 'neighbour'}</p>
            </div>
          </div>

          <div className="profile-local-badge">⌖ {localArea || 'Local area not set'}</div>

          <div className="profile-bio-preview">
            {bio || 'Tell your neighbours a little about yourself.'}
          </div>

          <div className="profile-preview-grid">
            <div>
              <strong>{showLocalArea ? 'Visible' : 'Private'}</strong>
              <span>Local area</span>
            </div>

            <div>
              <strong>Live</strong>
              <span>Profile</span>
            </div>
          </div>

          <div className="profile-safety">
            <strong>Your privacy</strong>

            <p>You control whether your local area appears on your profile.</p>
          </div>
        </aside>

        <section className="profile-editor">
          <div className="profile-editor-header">
            <div>
              <span>EDIT PROFILE</span>

              <h2>Your public information</h2>

              <p>Keep your Neighbour™ identity current and useful.</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              <span>Username</span>

              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
              />
            </label>

            <label>
              <span>Country code</span>

              <input
                value={countryCode}
                maxLength={2}
                autoCapitalize="characters"
                autoComplete="country"
                onChange={(event) => {
                  setCountryCode(event.target.value.toUpperCase());
                  clearResolvedLocation();
                }}
                placeholder="GB"
              />
            </label>
          </div>

          <section className="profile-location-editor">
            <div className="profile-location-heading">
              <div>
                <span>LOCATION</span>
                <h3>Find your local area</h3>
              </div>

              <p>
                Enter your postcode, ZIP or postal code. Your exact postal information and
                coordinates remain private.
              </p>
            </div>

            <div className="profile-location-input-row">
              <label>
                <span>Postcode / ZIP / postal code</span>

                <input
                  value={postalCode}
                  autoCapitalize="characters"
                  autoComplete="postal-code"
                  onChange={(event) => {
                    setPostalCode(event.target.value);
                    clearResolvedLocation();
                  }}
                  placeholder="M9 7AB"
                />
              </label>

              <button
                type="button"
                className="profile-location-find"
                disabled={
                  resolvingLocation || countryCode.trim().length !== 2 || !postalCode.trim()
                }
                onClick={() => void findLocation()}
              >
                {resolvingLocation ? 'Finding…' : 'Find location'}
              </button>
            </div>

            {locationMessage ? (
              <div className="profile-location-message">{locationMessage}</div>
            ) : null}

            {resolvedCity || resolvedRegion ? (
              <div className="profile-location-result">
                <div className="profile-location-result-icon">⌖</div>

                <div>
                  <strong>{[resolvedCity, resolvedRegion].filter(Boolean).join(', ')}</strong>

                  <span>This becomes your Neighbour™ local area.</span>
                </div>
              </div>
            ) : localArea ? (
              <div className="profile-location-result">
                <div className="profile-location-result-icon">⌖</div>

                <div>
                  <strong>{localArea}</strong>
                  <span>Current local area</span>
                </div>
              </div>
            ) : null}
          </section>

          <section className="profile-photo-editor">
            <div className="profile-photo-editor-copy">
              <span>PROFILE PHOTO</span>
              <h3>Your Neighbour™ photo</h3>
              <p>
                This photo is shared across your Neighbour™ account, including the app and website.
              </p>
            </div>

            <div className="profile-photo-editor-row">
              <div className="profile-photo-editor-preview">
                {avatarUrl ? <img src={avatarUrl} alt="Your profile" /> : initials}
              </div>

              <div className="profile-photo-editor-actions">
                <label className="profile-photo-upload">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    disabled={uploadingAvatar}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void changeProfilePhoto(file);
                      event.currentTarget.value = '';
                    }}
                  />

                  {uploadingAvatar ? 'Working…' : avatarUrl ? 'Change photo' : 'Choose photo'}
                </label>

                {avatarUrl ? (
                  <button
                    type="button"
                    className="profile-photo-remove"
                    disabled={uploadingAvatar}
                    onClick={() => void removeProfilePhoto()}
                  >
                    Remove photo
                  </button>
                ) : null}

                {avatarMessage ? (
                  <div className="profile-photo-message">{avatarMessage}</div>
                ) : null}
              </div>
            </div>
          </section>

          <label className="profile-bio-field">
            <span>About you</span>

            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Tell your neighbours about yourself"
            />

            <small>
              A short introduction helps local neighbours know who they’re connecting with.
            </small>
          </label>

          <div className="profile-privacy-row">
            <div>
              <strong>Show local area</strong>

              <p>Allow your local area to appear on your public profile.</p>
            </div>

            <button
              type="button"
              className={showLocalArea ? 'profile-toggle profile-toggle-on' : 'profile-toggle'}
              aria-pressed={showLocalArea}
              onClick={() => setShowLocalArea((current) => !current)}
            >
              <span />
            </button>
          </div>

          {message ? <div className="profile-message">{message}</div> : null}

          <div className="profile-actions">
            {profile?.username ? (
              <Link
                className="profile-map-link"
                href={`/profile/${encodeURIComponent(profile.username)}/map`}
              >
                Personal Map
              </Link>
            ) : null}
            <button
              type="button"
              disabled={busy || !profile || !username.trim()}
              onClick={() => void saveProfile()}
            >
              {busy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </section>
      </section>

      <style>{`
        .profile-avatar {
          overflow: hidden;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .profile-photo-editor {
          padding: 22px;
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 22px;
          background: rgba(248, 250, 252, 0.78);
        }

        .profile-photo-editor-copy > span {
          display: block;
          margin-bottom: 5px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          opacity: 0.58;
        }

        .profile-photo-editor-copy h3 {
          margin: 0;
        }

        .profile-photo-editor-copy p {
          margin: 6px 0 0;
          opacity: 0.68;
        }

        .profile-photo-editor-row {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 18px;
        }

        .profile-photo-editor-preview {
          width: 88px;
          height: 88px;
          flex: 0 0 88px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 999px;
          background: #eef2f7;
          font-size: 24px;
          font-weight: 800;
        }

        .profile-photo-editor-preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .profile-photo-editor-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .profile-photo-upload {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          background: #111827;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .profile-photo-upload input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .profile-photo-remove {
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          border-radius: 12px;
          background: white;
          cursor: pointer;
          font-weight: 700;
        }

        .profile-photo-upload:has(input:disabled),
        .profile-photo-remove:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .profile-photo-message {
          width: 100%;
          font-size: 13px;
          opacity: 0.72;
        }

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

        .profile-location-editor {
          display: grid;
          gap: 15px;
          margin-top: 16px;
          padding: 18px;
          border: 1px solid #dce7e1;
          border-radius: 16px;
          background: #f7faf8;
        }

        .profile-location-heading {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
        }

        .profile-location-heading > div > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .profile-location-heading h3 {
          margin: 5px 0 0;
          color: #173229;
          font-size: 15px;
        }

        .profile-location-heading p {
          max-width: 360px;
          margin: 0;
          color: #74827b;
          font-size: 9px;
          line-height: 1.55;
        }

        .profile-location-input-row {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto;
          gap: 10px;
          align-items: end;
        }

        .profile-location-find {
          min-width: 120px;
          min-height: 44px;
          padding: 0 16px;
          border: 0;
          border-radius: 12px;
          background: #086240;
          color: #fff;
          font: inherit;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .profile-location-find:disabled {
          opacity: .45;
          cursor: default;
        }

        .profile-location-message {
          padding: 10px 12px;
          border-radius: 10px;
          background: #eef5f1;
          color: #53675e;
          font-size: 9px;
        }

        .profile-location-result {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border-radius: 12px;
          background: #edf6f1;
        }

        .profile-location-result-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          border-radius: 10px;
          background: #dceee4;
          color: #086240;
          font-size: 15px;
        }

        .profile-location-result strong,
        .profile-location-result span {
          display: block;
        }

        .profile-location-result strong {
          color: #214438;
          font-size: 11px;
        }

        .profile-location-result span {
          margin-top: 3px;
          color: #76877e;
          font-size: 8px;
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

        .profile-map-link {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          border: 1px solid #0e5b3a;
          border-radius: 12px;
          color: #0e5b3a;
          background: #ffffff;
          font-weight: 800;
          text-decoration: none;
          transition: background 160ms ease, color 160ms ease, transform 160ms ease;
        }

        .profile-map-link:hover {
          background: #eef7f2;
          transform: translateY(-1px);
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

          .profile-location-heading {
            flex-direction: column;
            gap: 8px;
          }

          .profile-location-input-row {
            grid-template-columns: 1fr;
          }

          .profile-location-find {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
