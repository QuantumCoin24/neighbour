'use client';

import {
  blockSocialGraphUser,
  createConversation,
  getPostsByProfile,
  getPublicProfile,
  getRelationshipStatus,
  sendConnectionRequest,
  type PublicProfile,
  unblockSocialGraphUser,
} from '@neighbour/api-client';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import ReportButton from '../../../components/security/ReportButton';

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{
    username: string;
  }>;
}) {
  const { username } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [relationship, setRelationship] = useState<any>(null);
  const [message, setMessage] = useState('Loading profile...');
  const [connecting, setConnecting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await getPublicProfile(username);

        setProfile(result);

        const profilePosts = await getPostsByProfile(username);

        setPosts(profilePosts.items);

        const token = localStorage.getItem('accessToken') ?? '';

        if (token) {
          const relation = await getRelationshipStatus(token, result.userId);
          setRelationship(relation);
        }
      } catch {
        setMessage('Profile not found.');
      }
    }

    void load();
  }, [username]);

  async function connect(): Promise<void> {
    const token = localStorage.getItem('accessToken');

    if (!token || !profile || connecting) return;

    try {
      setConnecting(true);

      await sendConnectionRequest(token, profile.userId);

      const updated = await getRelationshipStatus(token, profile.userId);

      setRelationship(updated);
    } finally {
      setConnecting(false);
    }
  }

  async function startConversation(): Promise<void> {
    const token = localStorage.getItem('accessToken');

    if (!token || !profile || messaging) {
      return;
    }

    try {
      setMessaging(true);

      const conversation = await createConversation(token, {
        type: 'DIRECT',
        memberIds: [profile.userId],
      });

      router.push(`/messages/${conversation.id}`);
    } finally {
      setMessaging(false);
    }
  }

  async function toggleBlock(): Promise<void> {
    const token = localStorage.getItem('accessToken');

    if (!token || !profile || blocking) return;

    try {
      setBlocking(true);

      if (relationship?.status === 'BLOCKED_BY_ME') {
        await unblockSocialGraphUser(profile.userId);
      } else {
        await blockSocialGraphUser(profile.userId);
      }

      const updated = await getRelationshipStatus(token, profile.userId);

      setRelationship(updated);
    } finally {
      setBlocking(false);
    }
  }

  if (!profile) {
    return <main className="profile-loading">{message}</main>;
  }

  const initials = profile.displayName.slice(0, 2).toUpperCase();

  const relationshipLabel =
    relationship?.status === 'CONNECTED'
      ? 'Connected'
      : relationship?.status === 'OUTGOING_REQUEST'
        ? 'Request sent'
        : connecting
          ? 'Sending…'
          : 'Add Neighbour';

  return (
    <main className="public-profile">
      <section className="profile-hero">
        <div className="profile-cover">
          <div className="profile-cover-glow profile-cover-glow-a" />
          <div className="profile-cover-glow profile-cover-glow-b" />
        </div>

        <div className="profile-identity-row">
          <div className="profile-avatar">
            {'avatarUrl' in profile &&
            typeof profile.avatarUrl === 'string' &&
            profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              initials
            )}
          </div>

          <div className="profile-primary">
            <span className="profile-eyebrow">NEIGHBOUR PROFILE</span>
            <h1>{profile.displayName}</h1>
            <p>@{profile.username}</p>
          </div>

          <div className="profile-actions">
            <button
              className="profile-connect"
              type="button"
              onClick={() => void connect()}
              disabled={
                connecting ||
                blocking ||
                relationship?.status === 'CONNECTED' ||
                relationship?.status === 'OUTGOING_REQUEST' ||
                relationship?.status === 'BLOCKED_BY_ME' ||
                relationship?.status === 'BLOCKED_ME'
              }
            >
              {relationshipLabel}
            </button>

            <button
              className="profile-connect"
              type="button"
              disabled={
                messaging ||
                relationship?.status === 'BLOCKED_BY_ME' ||
                relationship?.status === 'BLOCKED_ME'
              }
              onClick={() => void startConversation()}
            >
              {messaging ? 'Opening…' : 'Message'}
            </button>

            <button
              type="button"
              className="profile-block"
              disabled={blocking}
              onClick={() => void toggleBlock()}
            >
              {blocking
                ? 'Updating…'
                : relationship?.status === 'BLOCKED_BY_ME'
                  ? 'Unblock'
                  : 'Block'}
            </button>

            <ReportButton targetType="USER" targetId={profile.userId} />
          </div>
        </div>
      </section>

      <section className="profile-layout">
        <aside className="profile-about">
          <div className="profile-card">
            <span className="profile-card-label">ABOUT</span>

            <p className="profile-bio">
              {profile.bio?.trim() || 'This neighbour has not added a bio yet.'}
            </p>

            <div className="profile-detail">
              <span>Location</span>
              <strong>{profile.localArea ?? 'Location hidden'}</strong>
            </div>

            <div className="profile-detail">
              <span>Neighbour since</span>
              <strong>{new Date(profile.createdAt).toLocaleDateString('en-GB')}</strong>
            </div>
          </div>

          <div className="profile-card profile-status-card">
            <span className="profile-card-label">COMMUNITY</span>
            <div className="profile-status-dot-row">
              <span className="profile-status-dot" />
              <strong>Neighbour profile</strong>
            </div>
            <p>Connect and interact through the shared Neighbour™ community.</p>
          </div>
        </aside>

        <section className="profile-content">
          <header className="profile-content-header">
            <div>
              <span>ACTIVITY</span>
              <h2>Posts</h2>
            </div>

            <strong>{posts.length}</strong>
          </header>

          {posts.length === 0 ? (
            <div className="profile-empty">
              <div className="profile-empty-mark">N</div>
              <strong>No public posts yet.</strong>
              <span>Activity shared by this neighbour will appear here.</span>
            </div>
          ) : (
            <div className="profile-posts">
              {posts.map((post) => (
                <article className="profile-post" key={post.id}>
                  <div className="profile-post-author">
                    <div className="profile-post-avatar">{initials}</div>

                    <div>
                      <strong>{profile.displayName}</strong>
                      <span>@{profile.username}</span>
                    </div>
                  </div>

                  <p>{post.content}</p>

                  {post.createdAt ? (
                    <time>{new Date(post.createdAt).toLocaleString('en-GB')}</time>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .public-profile {
          width: min(100% - 48px, 1280px);
          margin: 0 auto;
          padding: 38px 0 80px;
          color: #14261d;
        }

        .profile-loading {
          padding: 60px;
        }

        .profile-hero {
          overflow: hidden;
          border: 1px solid #dfe9e4;
          border-radius: 30px;
          background: #fff;
          box-shadow: 0 20px 55px rgba(19,58,41,.08);
        }

        .profile-cover {
          position: relative;
          height: 210px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(3,59,39,.98), rgba(14,117,77,.9)),
            #0e754d;
        }

        .profile-cover-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
        }

        .profile-cover-glow-a {
          width: 330px;
          height: 330px;
          right: 6%;
          top: -170px;
          background: rgba(255,255,255,.1);
        }

        .profile-cover-glow-b {
          width: 250px;
          height: 250px;
          left: 9%;
          bottom: -180px;
          background: rgba(173,255,214,.13);
        }

        .profile-identity-row {
          display: flex;
          align-items: flex-end;
          gap: 22px;
          padding: 0 30px 28px;
        }

        .profile-avatar {
          width: 130px;
          height: 130px;
          flex: 0 0 130px;
          display: grid;
          place-items: center;
          overflow: hidden;
          margin-top: -62px;
          border: 6px solid #fff;
          border-radius: 38px;
          background: #e7f4ec;
          color: #0a6542;
          font-size: 35px;
          font-weight: 950;
          box-shadow: 0 13px 40px rgba(0,0,0,.13);
          z-index: 2;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-primary {
          min-width: 0;
          flex: 1;
        }

        .profile-eyebrow,
        .profile-card-label,
        .profile-content-header span {
          color: #0e754d;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .profile-primary h1 {
          margin: 6px 0 2px;
          font-size: 34px;
          letter-spacing: -.035em;
        }

        .profile-primary p {
          margin: 0;
          color: #718077;
        }

        .profile-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-block {
          border: 1px solid rgba(160, 38, 38, 0.22);
          border-radius: 999px;
          padding: 10px 18px;
          background: rgba(160, 38, 38, 0.06);
          color: #8e2424;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .profile-block:hover {
          background: rgba(160, 38, 38, 0.11);
        }

        .profile-block:disabled {
          cursor: default;
          opacity: 0.55;
        }

        .profile-connect {
          min-height: 44px;
          border: 0;
          border-radius: 999px;
          background: #0e754d;
          padding: 0 20px;
          color: #fff;
          cursor: pointer;
          font-weight: 850;
        }

        .profile-connect:disabled {
          opacity: .62;
          cursor: default;
        }

        .profile-layout {
          display: grid;
          grid-template-columns: 310px minmax(0,1fr);
          gap: 24px;
          margin-top: 24px;
        }

        .profile-about {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .profile-card,
        .profile-content {
          border: 1px solid #dfe9e4;
          border-radius: 25px;
          background: #fff;
          box-shadow: 0 14px 38px rgba(19,58,41,.055);
        }

        .profile-card {
          padding: 22px;
        }

        .profile-bio {
          margin: 13px 0 22px;
          color: #4c6056;
          line-height: 1.6;
        }

        .profile-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 0;
          border-top: 1px solid #edf1ef;
        }

        .profile-detail span {
          color: #8b9791;
          font-size: 11px;
        }

        .profile-detail strong {
          font-size: 13px;
        }

        .profile-status-dot-row {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 14px;
        }

        .profile-status-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #22a06b;
          box-shadow: 0 0 0 5px rgba(34,160,107,.12);
        }

        .profile-status-card p {
          margin: 13px 0 0;
          color: #718077;
          font-size: 13px;
          line-height: 1.55;
        }

        .profile-content {
          min-height: 450px;
          padding: 24px;
        }

        .profile-content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid #edf1ef;
        }

        .profile-content-header h2 {
          margin: 4px 0 0;
          font-size: 25px;
        }

        .profile-content-header > strong {
          min-width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #e8f5ed;
          color: #0b6945;
        }

        .profile-posts {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .profile-post {
          border: 1px solid #e5ece8;
          border-radius: 19px;
          padding: 18px;
          background: #fbfdfc;
        }

        .profile-post-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-post-avatar {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #e8f5ed;
          color: #0b6945;
          font-size: 11px;
          font-weight: 900;
        }

        .profile-post-author > div:last-child {
          display: flex;
          flex-direction: column;
        }

        .profile-post-author span,
        .profile-post time {
          color: #8b9791;
          font-size: 11px;
        }

        .profile-post p {
          margin: 15px 0 12px;
          color: #384c42;
          line-height: 1.6;
        }

        .profile-empty {
          min-height: 340px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          color: #7f8e86;
          text-align: center;
        }

        .profile-empty strong {
          color: #30453a;
        }

        .profile-empty-mark {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          margin-bottom: 7px;
          border-radius: 16px;
          background: #e8f5ed;
          color: #0b6945;
          font-weight: 950;
          font-size: 18px;
        }

        @media (max-width: 880px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }

          .profile-identity-row {
            flex-wrap: wrap;
          }

          .profile-actions {
            width: 100%;
            margin-left: 152px;
          }
        }

        @media (max-width: 620px) {
          .public-profile {
            width: min(100% - 26px, 1280px);
            padding-top: 22px;
          }

          .profile-cover {
            height: 160px;
          }

          .profile-identity-row {
            padding: 0 18px 22px;
          }

          .profile-avatar {
            width: 96px;
            height: 96px;
            flex-basis: 96px;
            margin-top: -45px;
            border-radius: 30px;
            font-size: 26px;
          }

          .profile-primary h1 {
            font-size: 27px;
          }

          .profile-actions {
            margin-left: 0;
          }
        }
      `}</style>
    </main>
  );
}
