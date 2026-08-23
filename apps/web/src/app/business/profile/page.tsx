'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';

import {
  createBusiness,
  getMyBusiness,
  getMyCommunities,
  type Business,
} from '@neighbour/api-client';

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState<Business | null>(null);

  const [communities, setCommunities] = useState<any[]>([]);

  const [communityId, setCommunityId] = useState('');

  const [name, setName] = useState('');

  const [category, setCategory] = useState('');

  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const current = await getMyBusiness();

        setBusiness(current);

        if (!current) {
          const token = localStorage.getItem('accessToken');

          if (token) {
            try {
              const memberships = await getMyCommunities(token);

              const active = memberships.filter((item: any) => item.status === 'ACTIVE');

              setCommunities(active);

              if (active.length > 0) {
                setCommunityId(active[0].community.id);
              }
            } catch {
              setCommunities([]);
            }
          }
        }
      } catch {
        setMessage('Unable to load your business profile.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function create() {
    if (busy || !communityId || !name.trim() || !category.trim()) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const created = await createBusiness({
        communityId,
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
      });

      setBusiness(created);
      setMessage('Business profile created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Business creation failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="business-profile-loading">
        Loading business profile…
        <style>{`
          .business-profile-loading {
            width: min(100% - 48px,900px);
            margin: 80px auto;
            padding: 24px;
            border-radius: 18px;
            background: #fff;
            color: #697970;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="business-profile-page">
      <header className="business-profile-header">
        <div>
          <div className="business-profile-eyebrow">BUSINESS IDENTITY</div>

          <h1>Business Profile</h1>

          <p>Manage the identity Neighbour™ uses across your local business presence.</p>
        </div>

        {business ? <Link href="/business/dashboard">Dashboard</Link> : null}
      </header>

      {business ? (
        <section className="business-profile-layout">
          <aside className="business-profile-preview">
            <div className="business-profile-mark">{business.name.slice(0, 2).toUpperCase()}</div>

            <div className="business-profile-label">YOUR BUSINESS</div>

            <h2>{business.name}</h2>

            <p className="business-profile-category">{business.category}</p>

            <div className="business-profile-description">
              {business.description || 'No business description has been added.'}
            </div>

            <div className="business-profile-state">
              <span />

              {business.verified ? 'Verified business' : 'Business active'}
            </div>
          </aside>

          <section className="business-profile-details">
            <div className="business-profile-details-heading">
              <span>LIVE PROFILE</span>

              <h2>Business information</h2>

              <p>This information is currently stored in the Neighbour™ business service.</p>
            </div>

            <div className="business-profile-fields">
              <div>
                <span>Business name</span>
                <strong>{business.name}</strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{business.category}</strong>
              </div>

              <div>
                <span>Verification</span>
                <strong>{business.verified ? 'Verified' : 'Active'}</strong>
              </div>

              <div>
                <span>Community</span>
                <strong>Connected</strong>
              </div>
            </div>

            <div className="business-profile-description-panel">
              <span>ABOUT YOUR BUSINESS</span>

              <p>{business.description || 'No description currently stored.'}</p>
            </div>

            <div className="business-profile-api-note">
              <strong>Business editing</strong>

              <p>
                Your existing business is loaded safely. The current backend does not expose a
                business-update operation, so this screen will not pretend to save changes that the
                API cannot persist.
              </p>
            </div>

            <div className="business-profile-actions">
              <Link href="/business/verification">Verification</Link>

              <Link href="/business/offers">Manage offers</Link>
            </div>
          </section>
        </section>
      ) : (
        <section className="business-create">
          <div className="business-create-heading">
            <span>GET STARTED</span>

            <h2>Create your business profile</h2>

            <p>Establish your Neighbour™ business identity in one of your communities.</p>
          </div>

          <div className="business-create-grid">
            <label>
              <span>Community</span>

              {communities.length > 0 ? (
                <select
                  value={communityId}
                  onChange={(event) => setCommunityId(event.target.value)}
                >
                  {communities.map((membership: any) => (
                    <option key={membership.community.id} value={membership.community.id}>
                      {membership.community.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={communityId}
                  onChange={(event) => setCommunityId(event.target.value)}
                  placeholder="Community ID"
                />
              )}
            </label>

            <label>
              <span>Business name</span>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Business name"
              />
            </label>

            <label>
              <span>Category</span>

              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Business category"
              />
            </label>
          </div>

          <label className="business-create-description">
            <span>Description</span>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell your local community about your business"
            />
          </label>

          {message ? <div className="business-profile-message">{message}</div> : null}

          <button
            type="button"
            disabled={busy || !communityId || !name.trim() || !category.trim()}
            onClick={() => void create()}
          >
            {busy ? 'Creating…' : 'Create business profile'}
          </button>
        </section>
      )}

      <style>{`
        .business-profile-page {
          width: min(100% - 48px,1200px);
          margin: 0 auto;
          padding: 42px 0 90px;
        }

        .business-profile-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 26px;
        }

        .business-profile-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .business-profile-header h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(34px,4vw,48px);
          letter-spacing: -.045em;
        }

        .business-profile-header p {
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
        }

        .business-profile-header a {
          padding: 11px 15px;
          border-radius: 12px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .business-profile-layout {
          display: grid;
          grid-template-columns:
            330px minmax(0,1fr);
          gap: 18px;
          align-items: start;
        }

        .business-profile-preview,
        .business-profile-details,
        .business-create {
          border: 1px solid #e1e7e3;
          border-radius: 21px;
          background: #fff;
        }

        .business-profile-preview {
          padding: 22px;
        }

        .business-profile-mark {
          width: 60px;
          height: 60px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              #0a714b,
              #06452f
            );
          color: #fff;
          font-size: 16px;
          font-weight: 850;
        }

        .business-profile-label {
          margin-top: 20px;
          color: #8a9690;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .business-profile-preview h2 {
          margin: 7px 0 0;
          color: #102019;
          font-size: 23px;
        }

        .business-profile-category {
          margin: 5px 0 0;
          color: #0a6945;
          font-size: 10px;
          font-weight: 750;
        }

        .business-profile-description {
          margin-top: 17px;
          padding: 13px;
          border-radius: 12px;
          background: #f7f9f8;
          color: #68776f;
          font-size: 10px;
          line-height: 1.55;
        }

        .business-profile-state {
          display: flex;
          gap: 7px;
          align-items: center;
          margin-top: 16px;
          color: #52665c;
          font-size: 9px;
          font-weight: 800;
        }

        .business-profile-state span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2fbe74;
        }

        .business-profile-details {
          padding: 25px;
        }

        .business-profile-details-heading span,
        .business-profile-description-panel > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .business-profile-details-heading h2 {
          margin: 6px 0 0;
          font-size: 21px;
        }

        .business-profile-details-heading p {
          margin: 5px 0 0;
          color: #7d8983;
          font-size: 9px;
        }

        .business-profile-fields {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 10px;
          margin-top: 21px;
        }

        .business-profile-fields div {
          padding: 14px;
          border-radius: 13px;
          background: #f7f9f8;
        }

        .business-profile-fields span {
          display: block;
          color: #8c9791;
          font-size: 8px;
        }

        .business-profile-fields strong {
          display: block;
          margin-top: 5px;
          color: #263b31;
          font-size: 11px;
        }

        .business-profile-description-panel {
          margin-top: 15px;
          padding: 16px;
          border-radius: 14px;
          background: #f7f9f8;
        }

        .business-profile-description-panel p {
          margin: 7px 0 0;
          color: #68776f;
          font-size: 10px;
          line-height: 1.55;
        }

        .business-profile-api-note {
          margin-top: 15px;
          padding: 15px;
          border-radius: 13px;
          background: #fff7e7;
        }

        .business-profile-api-note strong {
          color: #72581d;
          font-size: 10px;
        }

        .business-profile-api-note p {
          margin: 5px 0 0;
          color: #806c3c;
          font-size: 9px;
          line-height: 1.5;
        }

        .business-profile-actions {
          display: flex;
          gap: 8px;
          margin-top: 17px;
        }

        .business-profile-actions a {
          padding: 10px 13px;
          border-radius: 10px;
          background: #086240;
          color: #fff;
          text-decoration: none;
          font-size: 9px;
          font-weight: 800;
        }

        .business-create {
          padding: 25px;
        }

        .business-create-heading span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .business-create-heading h2 {
          margin: 6px 0 0;
        }

        .business-create-heading p {
          margin: 5px 0 0;
          color: #7a8781;
          font-size: 10px;
        }

        .business-create-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .business-create label,
        .business-create-description {
          display: grid;
          gap: 6px;
        }

        .business-create label span,
        .business-create-description span {
          color: #405249;
          font-size: 9px;
          font-weight: 800;
        }

        .business-create input,
        .business-create select,
        .business-create textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dce4df;
          border-radius: 11px;
          background: #fbfcfb;
          font: inherit;
          font-size: 11px;
        }

        .business-create input,
        .business-create select {
          min-height: 43px;
          padding: 0 11px;
        }

        .business-create-description {
          margin-top: 12px;
        }

        .business-create textarea {
          min-height: 120px;
          padding: 11px;
        }

        .business-create > button {
          margin-top: 16px;
          padding: 11px 15px;
          border: 0;
          border-radius: 11px;
          background: #086240;
          color: #fff;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
        }

        .business-profile-message {
          margin-top: 12px;
          padding: 10px;
          border-radius: 10px;
          background: #f2f6f4;
          color: #596d63;
          font-size: 9px;
        }

        @media (max-width: 850px) {
          .business-profile-layout,
          .business-create-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .business-profile-page {
            width: min(100% - 28px,680px);
            padding-top: 24px;
          }

          .business-profile-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
