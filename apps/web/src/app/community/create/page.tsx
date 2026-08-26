'use client';

import {
  ApiClientError,
  createCommunity,
  type CommunityCategory,
  type CommunityJoinPolicy,
  type CommunityVisibility,
  type CreateCommunityRequest,
} from '@neighbour/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CATEGORIES: Array<{ value: CommunityCategory; label: string }> = [
  { value: 'LOCAL_AREA', label: 'Local area' },
  { value: 'STREET', label: 'Street' },
  { value: 'ESTATE', label: 'Estate' },
  { value: 'VILLAGE', label: 'Village' },
  { value: 'TOWN', label: 'Town' },
  { value: 'CITY', label: 'City' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'PARENTS', label: 'Parents' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'CHARITY', label: 'Charity' },
  { value: 'BUSINESS_NETWORK', label: 'Business network' },
  { value: 'HOBBY', label: 'Hobby' },
  { value: 'FAITH', label: 'Faith' },
  { value: 'OTHER', label: 'Other' },
];

function normaliseHandle(value: string): string {
  return value
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40);
}

export default function CreateCommunityPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('LOCAL_AREA');
  const [tags, setTags] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [visibility, setVisibility] = useState<CommunityVisibility>('PUBLIC');
  const [joinPolicy, setJoinPolicy] = useState<CommunityJoinPolicy>('OPEN');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [rules, setRules] = useState('');
  const [allowMemberPosts, setAllowMemberPosts] = useState(true);
  const [allowBusinesses, setAllowBusinesses] = useState(true);
  const [allowMarketplace, setAllowMarketplace] = useState(true);
  const [allowEvents, setAllowEvents] = useState(true);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (name.trim().length < 3) {
      return 'Community name must contain at least three characters.';
    }

    if (handle.trim() && handle.trim().length < 3) {
      return 'The community handle must contain at least three characters.';
    }

    if (shortDescription.trim().length < 10) {
      return 'Add a short description of at least 10 characters.';
    }

    if (description.trim().length < 20) {
      return 'Add a community description of at least 20 characters.';
    }

    if (city.trim().length < 2) {
      return 'Enter the town or city for this community.';
    }

    if (postcode.trim().length < 5) {
      return 'Enter a valid UK postcode.';
    }

    return null;
  }

  async function submit() {
    if (submitting) return;

    const validation = validate();

    if (validation) {
      setMessage(validation);
      return;
    }

    const token = localStorage.getItem('accessToken');

    if (!token) {
      setMessage('Please sign in before creating a community.');
      return;
    }

    const data: CreateCommunityRequest = {
      name: name.trim(),
      ...(handle.trim() ? { handle: normaliseHandle(handle.trim()) } : {}),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      category,
      tags: tags
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12),
      city: city.trim(),
      postcode: postcode.trim().toUpperCase(),
      visibility,
      joinPolicy,
      approvalRequired: joinPolicy === 'APPROVAL',
      welcomeMessage: welcomeMessage.trim() || `Welcome to ${name.trim()}.`,
      rules: rules
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20),
      allowMemberPosts,
      allowBusinesses,
      allowMarketplace,
      allowEvents,
      discoverable: visibility === 'PUBLIC',
    };

    setSubmitting(true);
    setMessage('');

    try {
      const community = await createCommunity(token, data);
      router.replace(`/community/${community.slug}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setMessage('That community name or handle is already in use.');
      } else if (error instanceof ApiClientError && error.status === 400) {
        setMessage('Check the community details and try again.');
      } else {
        setMessage('Neighbour could not create the community. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="create-community-page">
      <header className="create-community-header">
        <div>
          <span>NEIGHBOUR™ COMMUNITY</span>
          <h1>Create a community</h1>
          <p>Build a local space for neighbours, interests, places or organisations.</p>
        </div>

        <button type="button" onClick={() => router.back()}>
          Back
        </button>
      </header>

      {message ? <div className="create-community-message">{message}</div> : null}

      <section className="create-community-grid">
        <div className="create-community-card">
          <h2>Identity</h2>

          <label>
            Community name
            <input
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Blackley Neighbours"
            />
          </label>

          <label>
            Community handle
            <input
              value={handle}
              maxLength={40}
              onChange={(event) => setHandle(normaliseHandle(event.target.value))}
              placeholder="Optional"
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CommunityCategory)}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="create-community-card">
          <h2>Purpose</h2>

          <label>
            Short description
            <input
              value={shortDescription}
              maxLength={160}
              onChange={(event) => setShortDescription(event.target.value)}
              placeholder="A short introduction"
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              maxLength={3000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell neighbours what this community is for"
            />
          </label>

          <label>
            Tags
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="local, parents, football"
            />
          </label>
        </div>

        <div className="create-community-card">
          <h2>Location</h2>

          <label>
            Town or city
            <input
              value={city}
              maxLength={100}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Manchester"
            />
          </label>

          <label>
            Postcode
            <input
              value={postcode}
              onChange={(event) => setPostcode(event.target.value.toUpperCase())}
              placeholder="M9 8AA"
            />
          </label>
        </div>

        <div className="create-community-card">
          <h2>Access</h2>

          <label>
            Visibility
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as CommunityVisibility)}
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="INVITE_ONLY">Invite only</option>
            </select>
          </label>

          <label>
            Join policy
            <select
              value={joinPolicy}
              onChange={(event) => setJoinPolicy(event.target.value as CommunityJoinPolicy)}
            >
              <option value="OPEN">Open</option>
              <option value="APPROVAL">Approval required</option>
              <option value="INVITE_ONLY">Invite only</option>
            </select>
          </label>
        </div>

        <div className="create-community-card">
          <h2>Community settings</h2>

          <label className="toggle">
            <input
              type="checkbox"
              checked={allowMemberPosts}
              onChange={(event) => setAllowMemberPosts(event.target.checked)}
            />
            Members can post
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={allowBusinesses}
              onChange={(event) => setAllowBusinesses(event.target.checked)}
            />
            Businesses allowed
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={allowMarketplace}
              onChange={(event) => setAllowMarketplace(event.target.checked)}
            />
            Marketplace allowed
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={allowEvents}
              onChange={(event) => setAllowEvents(event.target.checked)}
            />
            Events allowed
          </label>
        </div>

        <div className="create-community-card">
          <h2>Welcome & rules</h2>

          <label>
            Welcome message
            <textarea
              value={welcomeMessage}
              maxLength={500}
              onChange={(event) => setWelcomeMessage(event.target.value)}
              placeholder="Optional welcome message"
            />
          </label>

          <label>
            Rules
            <textarea
              value={rules}
              onChange={(event) => setRules(event.target.value)}
              placeholder="One rule per line"
            />
          </label>
        </div>
      </section>

      <section className="create-community-review">
        <div>
          <span>READY TO PUBLISH</span>
          <h2>{name.trim() || 'Your new community'}</h2>
          <p>{shortDescription.trim() || 'Complete the details above.'}</p>
        </div>

        <button type="button" disabled={submitting} onClick={() => void submit()}>
          {submitting ? 'Creating…' : 'Create community'}
        </button>
      </section>

      <style>{`
        .create-community-page {
          width: min(100% - 48px, 1180px);
          margin: 0 auto;
          padding: 42px 0 90px;
          color: #102019;
        }

        .create-community-header,
        .create-community-review {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .create-community-header span,
        .create-community-review span {
          color: #0a6945;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .create-community-header h1 {
          margin: 7px 0 6px;
          font-size: clamp(34px, 5vw, 50px);
        }

        .create-community-header p,
        .create-community-review p {
          margin: 0;
          color: #718078;
        }

        .create-community-header button,
        .create-community-review button {
          border: 0;
          border-radius: 999px;
          padding: 13px 22px;
          font: inherit;
          font-weight: 850;
          cursor: pointer;
        }

        .create-community-header button {
          background: #eef4f1;
          color: #244238;
        }

        .create-community-message {
          margin-top: 22px;
          padding: 14px 18px;
          border-radius: 14px;
          background: #fff4e5;
          color: #714b13;
        }

        .create-community-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 26px;
        }

        .create-community-card {
          padding: 24px;
          border: 1px solid #dfe9e4;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 14px 36px rgba(19,58,41,.05);
        }

        .create-community-card h2 {
          margin: 0 0 18px;
        }

        .create-community-card label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 15px;
          color: #41564b;
          font-size: 12px;
          font-weight: 750;
        }

        .create-community-card input,
        .create-community-card textarea,
        .create-community-card select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dce6e1;
          border-radius: 13px;
          padding: 12px 13px;
          background: #fafcfb;
          color: #102019;
          font: inherit;
        }

        .create-community-card textarea {
          min-height: 110px;
          resize: vertical;
        }

        .create-community-card .toggle {
          flex-direction: row;
          align-items: center;
          gap: 10px;
        }

        .create-community-card .toggle input {
          width: auto;
        }

        .create-community-review {
          margin-top: 24px;
          padding: 25px;
          border-radius: 24px;
          background: #073e2a;
          color: #fff;
        }

        .create-community-review span {
          color: #9fe4c5;
        }

        .create-community-review p {
          color: rgba(255,255,255,.74);
        }

        .create-community-review button {
          background: #fff;
          color: #075438;
        }

        .create-community-review button:disabled {
          opacity: .6;
          cursor: default;
        }

        @media (max-width: 760px) {
          .create-community-grid {
            grid-template-columns: 1fr;
          }

          .create-community-header,
          .create-community-review {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
