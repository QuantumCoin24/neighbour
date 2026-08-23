'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiRequest, getMyProfile } from '@neighbour/api-client';

import { NeighbourCard } from '@neighbour/design-system';

import { getNeighbourContext, type NeighbourContext } from '../../lib/neighbour-context';

import { getCommunityActivity, type CommunityActivityData } from '../../lib/community-activity';

import NeighbourHeader from '../../components/dashboard/NeighbourHeader';
import ProfileSummary from '../../components/dashboard/ProfileSummary';
import CommunityPulse from '../../components/dashboard/CommunityPulse';
import CommunityIdentity from '../../components/dashboard/CommunityIdentity';
import CommunityStats from '../../components/dashboard/CommunityStats';
import FeedPreview from '../../components/dashboard/FeedPreview';
import EventPreview from '../../components/dashboard/EventPreview';
import MessagePreview from '../../components/dashboard/MessagePreview';
import NotificationPreview from '../../components/dashboard/NotificationPreview';
import CommunityActivity from '../../components/dashboard/CommunityActivity';
import ActionCentre from '../../components/dashboard/ActionCentre';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Profile {
  id: string;
  userId: string;
  username: string;
  localArea: string | null;
  bio?: string | null;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [context, setContext] = useState<NeighbourContext | null>(null);

  const [activity, setActivity] = useState<CommunityActivityData | null>(null);

  const [message, setMessage] = useState('Loading your neighbourhood...');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          setMessage('No active session found.');
          return;
        }

        const response = await apiRequest<User>('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response);

        const profileResponse = await getMyProfile(token);

        setProfile(profileResponse);

        const neighbourContext = await getNeighbourContext(token, profileResponse.localArea);

        setContext(neighbourContext);

        const activityData = await getCommunityActivity(
          token,
          neighbourContext.communitySlug,
          neighbourContext.communityId,
        );

        setActivity(activityData);
      } catch {
        setMessage('Unable to load your neighbourhood.');
      }
    }

    void load();
  }, []);

  if (!user) {
    return (
      <div className="home-loading">
        <NeighbourCard>
          <h2>{message}</h2>
          <p>Connecting you to your local Neighbour™ community.</p>
        </NeighbourCard>

        <style>{`
          .home-loading {
            width: min(100% - 40px, 760px);
            margin: 80px auto;
          }
        `}</style>
      </div>
    );
  }

  const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') ?? '') : '';

  const firstName = user.displayName.split(' ')[0] || user.displayName;

  return (
    <main className="home-page">
      <header className="home-topbar">
        <div>
          <div className="home-eyebrow">YOUR NEIGHBOURHOOD</div>

          <h1>Good evening, {firstName} 👋</h1>

          <p>Here’s what is happening around you.</p>
        </div>

        <div className="home-top-actions">
          <Link href="/search" className="home-action home-action-secondary">
            Search
          </Link>

          <Link href="/community" className="home-action home-action-primary">
            + Create post
          </Link>
        </div>
      </header>

      <section className="home-hero">
        <NeighbourHeader name={user.displayName} area={profile?.localArea ?? null} />
      </section>

      <section className="home-layout">
        <div className="home-main-column">
          <div className="home-section-heading">
            <div>
              <span>Neighbourhood feed</span>
              <p>Latest updates from your local community.</p>
            </div>

            <Link href="/community">View all</Link>
          </div>

          <FeedPreview token={token} communitySlug={context?.communitySlug ?? undefined} />

          <div className="home-two-column">
            <EventPreview communityId={context?.communityId ?? undefined} />

            <CommunityPulse area={profile?.localArea ?? null} />
          </div>

          <div className="home-section-heading home-section-spacing">
            <div>
              <span>Your local community</span>
              <p>People, conversations and activity around you.</p>
            </div>
          </div>

          <CommunityIdentity
            neighbourhoodName={context?.neighbourhoodName ?? null}
            communityName={context?.communityName ?? null}
          />

          <CommunityActivity
            memberCount={context?.communityMemberCount ?? null}
            postCount={activity?.postCount ?? 0}
            eventCount={activity?.eventCount ?? 0}
            conversationCount={activity?.conversationCount ?? 0}
          />

          <div className="home-section-heading home-section-spacing">
            <div>
              <span>Inbox & activity</span>
              <p>Messages and neighbourhood updates that need your attention.</p>
            </div>
          </div>

          <div className="home-inbox-grid">
            <MessagePreview token={token} />

            <NotificationPreview token={token} />
          </div>
        </div>

        <aside className="home-right-rail">
          <div className="home-rail-card home-profile-card">
            <div className="home-rail-label">YOUR PROFILE</div>

            <ProfileSummary name={user.displayName} bio={profile?.bio} />
          </div>

          <div className="home-rail-card">
            <div className="home-rail-heading">Quick actions</div>

            <div className="home-quick-actions">
              <Link href="/community">
                <span>＋</span>
                Share an update
              </Link>

              <Link href="/messages">
                <span>□</span>
                Message neighbours
              </Link>

              <Link href="/my-community">
                <span>⌖</span>
                Explore nearby
              </Link>

              <Link href="/notifications">
                <span>◇</span>
                Notifications
              </Link>
            </div>
          </div>

          <CommunityStats
            communityName={context?.communityName ?? null}
            memberCount={context?.communityMemberCount ?? null}
          />

          <ActionCentre />

          <div className="home-rail-note">
            <div className="home-rail-note-mark">N</div>

            <div>
              <strong>Your local space</strong>

              <p>Everything here is centred around your neighbourhood.</p>
            </div>
          </div>
        </aside>
      </section>

      <style>{`
        .home-page {
          width: min(100% - 48px, 1420px);
          margin: 0 auto;
          padding: 42px 0 80px;
          box-sizing: border-box;
        }

        .home-topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .home-eyebrow {
          margin-bottom: 8px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
        }

        .home-topbar h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(
            28px,
            3vw,
            40px
          );
          line-height: 1.05;
          letter-spacing: -.045em;
        }

        .home-topbar p {
          margin: 9px 0 0;
          color: #75827c;
          font-size: 14px;
        }

        .home-top-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        .home-action {
          min-height: 42px;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border-radius: 13px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }

        .home-action-primary {
          background: #086240;
          color: #ffffff;
          box-shadow:
            0 10px 24px
            rgba(8,98,64,.14);
        }

        .home-action-secondary {
          border: 1px solid #dce4df;
          background: #ffffff;
          color: #263b32;
        }

        .home-hero {
          margin-bottom: 24px;
        }

        .home-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            318px;
          gap: 24px;
          align-items: start;
        }

        .home-main-column {
          min-width: 0;
        }

        .home-right-rail {
          min-width: 0;
          display: grid;
          gap: 18px;
          position: sticky;
          top: 24px;
        }

        .home-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin: 4px 2px 14px;
        }

        .home-section-heading span {
          display: block;
          color: #102019;
          font-size: 19px;
          font-weight: 850;
          letter-spacing: -.025em;
        }

        .home-section-heading p {
          margin: 4px 0 0;
          color: #7a8781;
          font-size: 12px;
        }

        .home-section-heading > a {
          color: #0b6846;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }

        .home-section-spacing {
          margin-top: 26px;
        }

        .home-two-column {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 18px;
        }

        .home-inbox-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
          align-items: start;
        }

        .home-rail-card {
          padding: 20px;
          border: 1px solid
            rgba(17,48,37,.07);
          border-radius: 20px;
          background: #ffffff;
          box-shadow:
            0 12px 34px
            rgba(19,45,34,.045);
        }

        .home-profile-card {
          padding: 6px;
        }

        .home-rail-label {
          margin:
            16px 16px
            -2px;
          color: #8a9690;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .home-rail-heading {
          margin-bottom: 15px;
          color: #102019;
          font-size: 16px;
          font-weight: 850;
        }

        .home-quick-actions {
          display: grid;
          gap: 7px;
        }

        .home-quick-actions a {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 42px;
          padding: 0 10px;
          border-radius: 12px;
          color: #273a32;
          text-decoration: none;
          font-size: 12px;
          font-weight: 720;
          transition:
            background .15s ease,
            transform .15s ease;
        }

        .home-quick-actions a:hover {
          background: #f5f8f6;
          transform: translateX(1px);
        }

        .home-quick-actions span {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #edf6f1;
          color: #08704a;
          font-size: 15px;
          font-weight: 800;
        }

        .home-rail-note {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 17px;
          background:
            linear-gradient(
              145deg,
              #f3f8f5,
              #edf5f1
            );
        }

        .home-rail-note-mark {
          width: 31px;
          height: 31px;
          flex: 0 0 31px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #07583a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
        }

        .home-rail-note strong {
          color: #20372d;
          font-size: 11px;
        }

        .home-rail-note p {
          margin: 4px 0 0;
          color: #77847e;
          font-size: 9px;
          line-height: 1.5;
        }

        /*
         * Existing dashboard widgets carry their
         * own top margins. Inside the new layout,
         * normalise the first level so they behave
         * as dashboard modules rather than a stack.
         */
        .home-main-column > div,
        .home-right-rail > div {
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 1180px) {
          .home-layout {
            grid-template-columns:
              minmax(0, 1fr)
              292px;
          }
        }

        @media (max-width: 1020px) {
          .home-layout {
            grid-template-columns: 1fr;
          }

          .home-right-rail {
            position: static;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .home-page {
            width: min(100% - 28px, 680px);
            padding: 22px 0 100px;
          }

          .home-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .home-top-actions {
            width: 100%;
          }

          .home-action {
            flex: 1;
          }

          .home-two-column,
          .home-inbox-grid,
          .home-right-rail {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
