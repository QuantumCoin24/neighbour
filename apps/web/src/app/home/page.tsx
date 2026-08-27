'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiRequest, getMyProfile } from '@neighbour/api-client';

import { NeighbourCard } from '@neighbour/design-system';

import { getNeighbourContext, type NeighbourContext } from '../../lib/neighbour-context';

import { getCommunityActivity, type CommunityActivityData } from '../../lib/community-activity';

import ProfileSummary from '../../components/dashboard/ProfileSummary';
import CommunityPulse from '../../components/dashboard/CommunityPulse';
import CommunityIdentity from '../../components/dashboard/CommunityIdentity';
import CommunityStats from '../../components/dashboard/CommunityStats';
import FeedPreview from '../../components/dashboard/FeedPreview';
import EventPreview from '../../components/dashboard/EventPreview';
import MessagePreview from '../../components/dashboard/MessagePreview';
import NotificationPreview from '../../components/dashboard/NotificationPreview';
import CommunityActivity from '../../components/dashboard/CommunityActivity';

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
        .home-page {
          width: min(100% - 44px, 1540px);
          margin: 0 auto;
          padding: 34px 0 84px;
          box-sizing: border-box;
        }

        .home-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 34px;
          margin-bottom: 24px;
          padding: 26px 28px;
          border: 1px solid rgba(15, 66, 47, 0.08);
          border-radius: 26px;
          background:
            radial-gradient(circle at 95% 0%, rgba(27, 125, 86, 0.08), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #fbfdfc 48%, #f4f9f6 100%);
          box-shadow: 0 18px 50px rgba(24, 58, 44, 0.055);
        }

        .home-welcome {
          min-width: 0;
          max-width: 720px;
        }

        .home-eyebrow {
          margin-bottom: 9px;
          color: #0a6945;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .home-topbar h1 {
          margin: 0;
          color: #102019;
          font-size: clamp(30px, 2.7vw, 43px);
          line-height: 1.03;
          letter-spacing: -0.047em;
        }

        .home-topbar p {
          max-width: 620px;
          margin: 10px 0 0;
          color: #6f7f77;
          font-size: 14px;
          line-height: 1.55;
        }

        .home-top-actions {
          display: flex;
          align-items: stretch;
          gap: 10px;
          flex-shrink: 0;
        }

        .home-search-action {
          min-width: 265px;
          min-height: 54px;
          display: flex;
          align-items: center;
          gap: 11px;
          box-sizing: border-box;
          padding: 8px 14px;
          border: 1px solid #dbe5df;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.92);
          color: #24392f;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(23, 58, 43, 0.04);
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.15s ease;
        }

        .home-search-action:hover {
          border-color: #bcd2c6;
          box-shadow: 0 12px 30px rgba(23, 58, 43, 0.075);
          transform: translateY(-1px);
        }

        .home-search-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #edf6f1;
          color: #096745;
          font-size: 20px;
          font-weight: 800;
        }

        .home-search-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .home-search-copy strong {
          color: #1d3429;
          font-size: 12px;
          font-weight: 850;
        }

        .home-search-copy small {
          overflow: hidden;
          color: #849089;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .home-action {
          min-height: 54px;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 19px;
          border-radius: 16px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 850;
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
        }

        .home-action:hover {
          transform: translateY(-1px);
        }

        .home-action-primary {
          background: #086240;
          color: #ffffff;
          box-shadow: 0 12px 28px rgba(8, 98, 64, 0.17);
        }

        .home-hero {
          margin-bottom: 28px;
        }

        .home-social-shell {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr) 318px;
          gap: 22px;
          align-items: start;
        }

        .home-local-rail {
          min-width: 0;
          display: grid;
          gap: 14px;
          position: sticky;
          top: 24px;
        }

        .home-local-card {
          box-sizing: border-box;
          padding: 18px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 20px;
          background:
            radial-gradient(circle at 100% 0%, rgba(15,115,76,.08), transparent 42%),
            linear-gradient(145deg,#ffffff,#f7faf8);
          box-shadow: 0 12px 34px rgba(19,45,34,.045);
        }

        .home-local-kicker,
        .home-local-section-label {
          color: #829088;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .14em;
        }

        .home-local-identity > strong {
          display: block;
          margin-top: 11px;
          color: #102019;
          font-size: 17px;
          line-height: 1.2;
          letter-spacing: -.025em;
        }

        .home-local-identity > span {
          display: block;
          margin-top: 5px;
          color: #78857e;
          font-size: 11px;
        }

        .home-local-status {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 15px;
          color: #527064;
          font-size: 10px;
          font-weight: 750;
        }

        .home-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #0a8b59;
          box-shadow: 0 0 0 4px rgba(10,139,89,.10);
        }

        .home-local-nav {
          display: grid;
          gap: 4px;
          padding: 7px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 12px 34px rgba(19,45,34,.04);
        }

        .home-local-nav a {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 10px;
          border-radius: 14px;
          color: #263b32;
          text-decoration: none;
          transition:
            background .16s ease,
            transform .16s ease,
            box-shadow .16s ease;
        }

        .home-local-nav a:hover {
          background: #f2f7f4;
          transform: translateX(2px);
        }

        .home-local-nav a > span {
          width: 31px;
          height: 31px;
          flex: 0 0 31px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #edf6f1;
          color: #08704a;
          font-size: 14px;
          font-weight: 850;
        }

        .home-local-nav strong,
        .home-local-nav small {
          display: block;
        }

        .home-local-nav strong {
          color: #21372d;
          font-size: 11px;
        }

        .home-local-nav small {
          margin-top: 2px;
          color: #8b9690;
          font-size: 8px;
        }

        .home-local-events {
          min-width: 0;
        }

        .home-local-events .home-local-section-label {
          margin: 0 3px 8px;
        }

        .home-local-events .event-module {
          padding: 16px;
          border-radius: 18px;
        }

        .home-local-events .event-header h2 {
          font-size: 15px;
        }

        .home-local-events .event-header p,
        .home-local-events .event-header > a {
          display: none;
        }

        .home-local-signature {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 9px;
          color: #63736b;
        }

        .home-local-signature > span {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #07583a;
          color: white;
          font-size: 11px;
          font-weight: 950;
        }

        .home-local-signature strong,
        .home-local-signature small {
          display: block;
        }

        .home-local-signature strong {
          color: #30463b;
          font-size: 10px;
        }

        .home-local-signature small {
          margin-top: 1px;
          color: #97a09b;
          font-size: 8px;
        }

        .home-social-pulse {
          margin-top: 18px;
        }

        .home-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 30px;
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
          top: 22px;
        }

        .home-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin: 3px 3px 16px;
        }

        .home-section-heading span {
          display: block;
          color: #102019;
          font-size: 21px;
          font-weight: 880;
          letter-spacing: -0.032em;
        }

        .home-section-heading p {
          margin: 5px 0 0;
          color: #78867f;
          font-size: 12px;
          line-height: 1.45;
        }

        .home-section-heading > a {
          flex-shrink: 0;
          color: #0b6846;
          text-decoration: none;
          font-size: 12px;
          font-weight: 850;
        }

        .home-section-heading > a:hover {
          text-decoration: underline;
        }

        .home-section-spacing {
          margin-top: 32px;
        }

        .home-two-column {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
          gap: 20px;
          margin-top: 20px;
          align-items: stretch;
        }

        .home-inbox-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          align-items: start;
        }

        .home-rail-card {
          padding: 20px;
          border: 1px solid rgba(17, 48, 37, 0.075);
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 14px 38px rgba(19, 45, 34, 0.05);
        }

        .home-profile-card {
          padding: 7px;
        }

        .home-rail-label {
          margin: 16px 16px -2px;
          color: #84928b;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .home-profile-link {
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 3px 10px 10px;
          padding: 0 12px;
          border-radius: 12px;
          background: #f4f8f6;
          color: #28503e;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          transition: background 0.15s ease;
        }

        .home-profile-link:hover {
          background: #edf5f1;
        }

        .home-profile-link span {
          color: #08704a;
          font-size: 20px;
          line-height: 1;
        }

        .home-rail-heading-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .home-rail-kicker {
          margin-bottom: 4px;
          color: #8c9892;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        .home-rail-heading {
          color: #102019;
          font-size: 17px;
          font-weight: 880;
          letter-spacing: -0.02em;
        }

        .home-quick-actions {
          display: grid;
          gap: 7px;
        }

        .home-quick-actions a {
          min-height: 54px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 7px 9px;
          border-radius: 14px;
          color: #273a32;
          text-decoration: none;
          transition:
            background 0.15s ease,
            transform 0.15s ease;
        }

        .home-quick-actions a:hover {
          background: #f5f8f6;
          transform: translateX(2px);
        }

        .home-quick-actions > a > span {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #edf6f1;
          color: #08704a;
          font-size: 16px;
          font-weight: 850;
        }

        .home-quick-actions a > div {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .home-quick-actions strong {
          color: #21372d;
          font-size: 11px;
          font-weight: 820;
        }

        .home-quick-actions small {
          color: #86918b;
          font-size: 9px;
          line-height: 1.35;
        }

        .home-rail-note {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 17px;
          border: 1px solid rgba(18, 48, 38, 0.07);
          border-radius: 19px;
          background:
            radial-gradient(circle at 100% 0%, rgba(13, 111, 73, 0.08), transparent 42%),
            linear-gradient(145deg, #f5f9f7, #edf5f1);
        }

        .home-rail-note-mark {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #07583a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 7px 18px rgba(7, 88, 58, 0.17);
        }

        .home-rail-note strong {
          color: #20372d;
          font-size: 11px;
          font-weight: 850;
        }

        .home-rail-note p {
          margin: 5px 0 0;
          color: #728179;
          font-size: 9px;
          line-height: 1.55;
        }

        /*
         * Existing dashboard widgets remain responsible for their own
         * internal presentation. Build 96 only controls their desktop
         * composition and positioning.
         */
        .home-main-column > div,
        .home-right-rail > div {
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 1500px) {
          .home-layout {
            grid-template-columns: minmax(0, 1fr) 360px;
            gap: 34px;
          }
        }

        @media (max-width: 1280px) {
          .home-page {
            width: min(100% - 36px, 1380px);
          }

          .home-layout {
            grid-template-columns: minmax(0, 1fr) 310px;
            gap: 22px;
          }

          .home-search-action {
            min-width: 230px;
          }
        }

        @media (max-width: 1120px) {
          .home-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .home-top-actions {
            width: 100%;
          }

          .home-search-action {
            flex: 1;
          }

          .home-layout {
            grid-template-columns: 1fr;
          }

          .home-right-rail {
            position: static;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .home-rail-note {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 820px) {
          .home-page {
            width: min(100% - 30px, 760px);
            padding: 24px 0 100px;
          }

          .home-topbar {
            padding: 22px;
            border-radius: 22px;
          }

          .home-top-actions {
            flex-wrap: wrap;
          }

          .home-search-action {
            min-width: 100%;
          }

          .home-action {
            flex: 1;
          }

          .home-two-column,
          .home-inbox-grid,
          .home-right-rail {
            grid-template-columns: 1fr;
          }

          .home-rail-note {
            grid-column: auto;
          }
        }

        @media (max-width: 768px) {
          .home-page {
            width: min(100% - 28px, 680px);
            padding-top: 20px;
          }

          .home-topbar {
            margin-bottom: 20px;
            padding: 20px;
          }

          .home-topbar h1 {
            font-size: 30px;
          }

          .home-topbar p {
            font-size: 13px;
          }

          .home-search-action {
            min-height: 52px;
          }

          .home-section-heading {
            align-items: flex-start;
          }
        }

        @media (max-width: 520px) {
          .home-top-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .home-action {
            width: 100%;
          }

          .home-search-copy small {
            white-space: normal;
          }
        }
      `}</style>
      </div>
    );
  }

  const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') ?? '') : '';

  const firstName = user.displayName.split(' ')[0] || user.displayName;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="home-page">
      <header className="home-topbar">
        <div className="home-welcome">
          <div className="home-eyebrow">YOUR NEIGHBOURHOOD</div>

          <h1>
            {greeting}, {firstName} 👋
          </h1>

          <p>See what’s happening, connect locally and stay close to your community.</p>
        </div>

        <div className="home-top-actions">
          <Link href="/search" className="home-search-action">
            <span className="home-search-icon">⌕</span>

            <span className="home-search-copy">
              <strong>Search Neighbour™</strong>
              <small>People, places, communities & events</small>
            </span>
          </Link>

          <Link href="/community" className="home-action home-action-primary">
            <span>＋</span>
            Create post
          </Link>
        </div>
      </header>

      <section className="home-hero home-identity-hero">
        <div className="home-identity-avatar" aria-hidden="true">
          {user.displayName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('') || 'N'}
        </div>

        <div className="home-identity-copy">
          <div className="home-identity-kicker">YOUR NEIGHBOUR™</div>

          <div className="home-identity-name-row">
            <h2>{user.displayName}</h2>

            <span className="home-identity-live">
              <span />
              Local
            </span>
          </div>

          <p>
            <span>⌖</span>
            {profile?.localArea ?? context?.neighbourhoodName ?? 'Your local area'}
          </p>
        </div>

        <div className="home-identity-community">
          <small>CONNECTED COMMUNITY</small>
          <strong>{context?.communityName ?? 'Your community'}</strong>
          <span>
            {context?.communityMemberCount
              ? `${context.communityMemberCount.toLocaleString()} local neighbours`
              : 'Your local Neighbour™ network'}
          </span>
        </div>
      </section>

      <section className="home-social-shell">
        <aside className="home-local-rail">
          <div className="home-local-card home-local-identity">
            <div className="home-local-kicker">YOUR LOCAL WORLD</div>
            <strong>{context?.communityName ?? 'Your community'}</strong>
            <span>{profile?.localArea ?? 'Your local area'}</span>

            <div className="home-local-status">
              <span className="home-live-dot" />
              <span>Connected locally</span>
            </div>
          </div>

          <nav className="home-local-nav" aria-label="Local discovery">
            <Link href="/community">
              <span>⌂</span>
              <div>
                <strong>Community</strong>
                <small>Your neighbourhood</small>
              </div>
            </Link>

            <Link href="/nearby">
              <span>⌖</span>
              <div>
                <strong>Nearby</strong>
                <small>Explore around you</small>
              </div>
            </Link>

            <Link href="/marketplace">
              <span>◇</span>
              <div>
                <strong>Marketplace</strong>
                <small>Buy & sell locally</small>
              </div>
            </Link>

            <Link href="/community">
              <span>◷</span>
              <div>
                <strong>Events</strong>
                <small>What's happening</small>
              </div>
            </Link>
          </nav>

          <div className="home-local-events">
            <div className="home-local-section-label">AROUND YOU</div>
            <EventPreview communityId={context?.communityId ?? undefined} />
          </div>

          <div className="home-local-signature">
            <span>N</span>
            <div>
              <strong>Neighbour™</strong>
              <small>Closer starts local.</small>
            </div>
          </div>
        </aside>

        <div className="home-main-column">
          <FeedPreview token={token} communitySlug={context?.communitySlug ?? undefined} />

          <div className="home-social-pulse">
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
            <div className="home-rail-label">YOUR NEIGHBOUR™ IDENTITY</div>

            <ProfileSummary name={user.displayName} bio={profile?.bio} />

            <Link href="/profile/setup" className="home-profile-link">
              View & edit profile
              <span>›</span>
            </Link>
          </div>

          <CommunityStats
            communityName={context?.communityName ?? null}
            memberCount={context?.communityMemberCount ?? null}
          />

          <div className="home-rail-card">
            <div className="home-rail-heading-row">
              <div>
                <div className="home-rail-kicker">DO SOMETHING LOCAL</div>
                <div className="home-rail-heading">Quick actions</div>
              </div>
            </div>

            <div className="home-quick-actions">
              <Link href="/community">
                <span>＋</span>

                <div>
                  <strong>Share an update</strong>
                  <small>Post to your local community</small>
                </div>
              </Link>

              <Link href="/messages">
                <span>□</span>

                <div>
                  <strong>Messages</strong>
                  <small>Talk with your neighbours</small>
                </div>
              </Link>

              <Link href="/nearby">
                <span>⌖</span>

                <div>
                  <strong>Explore nearby</strong>
                  <small>Discover what’s around you</small>
                </div>
              </Link>

              <Link href="/notifications">
                <span>◇</span>

                <div>
                  <strong>Notifications</strong>
                  <small>See what needs your attention</small>
                </div>
              </Link>
            </div>
          </div>

          <div className="home-rail-note">
            <div className="home-rail-note-mark">N</div>

            <div>
              <strong>Your local space</strong>

              <p>
                Neighbour™ brings your people, places and community activity together in one local
                view.
              </p>
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

        @media (min-width: 1500px) {
          .home-page {
            width: min(100% - 56px, 1540px);
          }

          .home-social-shell {
            grid-template-columns: 230px minmax(0, 1fr) 330px;
            gap: 24px;
          }
        }

        @media (max-width: 1320px) {
          .home-social-shell {
            grid-template-columns: 190px minmax(0, 1fr) 292px;
            gap: 18px;
          }
        }

        @media (max-width: 1120px) {
          .home-social-shell {
            grid-template-columns: minmax(0, 1fr) 292px;
          }

          .home-local-rail {
            display: none;
          }
        }

        @media (max-width: 1020px) {
          .home-social-shell {
            grid-template-columns: 1fr;
          }
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

      <style jsx global>{`
        /*
         * BUILD 97C
         * Authenticated Home owns the desktop social experience.
         * These rules intentionally live beside the authenticated
         * render rather than the loading-state stylesheet.
         */

        .home-page {
          width: min(100% - 48px, 1540px) !important;
          margin: 0 auto !important;
          padding: 34px 0 84px !important;
          box-sizing: border-box !important;
        }

        .home-topbar {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 30px !important;
          margin-bottom: 24px !important;
          padding: 25px 27px !important;
          border: 1px solid rgba(15, 66, 47, 0.08) !important;
          border-radius: 26px !important;
          background:
            radial-gradient(circle at 95% 0%, rgba(27, 125, 86, 0.08), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #fbfdfc 48%, #f4f9f6 100%) !important;
          box-shadow: 0 18px 50px rgba(24, 58, 44, 0.055) !important;
        }

        .home-welcome {
          min-width: 0 !important;
          max-width: 690px !important;
        }

        .home-eyebrow {
          margin-bottom: 8px !important;
          color: #0a6945 !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          letter-spacing: 0.16em !important;
        }

        .home-topbar h1 {
          margin: 0 !important;
          color: #102019 !important;
          font-size: clamp(30px, 2.6vw, 43px) !important;
          line-height: 1.03 !important;
          letter-spacing: -0.047em !important;
        }

        .home-topbar p {
          margin: 9px 0 0 !important;
          color: #6f7f77 !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }

        .home-top-actions {
          display: flex !important;
          align-items: stretch !important;
          gap: 10px !important;
          flex-shrink: 0 !important;
        }

        .home-search-action,
        .home-search-action:visited {
          min-width: 260px !important;
          min-height: 54px !important;
          display: flex !important;
          align-items: center !important;
          gap: 11px !important;
          box-sizing: border-box !important;
          padding: 8px 14px !important;
          border: 1px solid #dbe5df !important;
          border-radius: 16px !important;
          background: rgba(255, 255, 255, 0.94) !important;
          color: #24392f !important;
          text-decoration: none !important;
          box-shadow: 0 8px 24px rgba(23, 58, 43, 0.04) !important;
          transition:
            transform 0.16s ease,
            border-color 0.16s ease,
            box-shadow 0.16s ease !important;
        }

        .home-search-action:hover {
          transform: translateY(-1px) !important;
          border-color: #bcd2c6 !important;
          box-shadow: 0 12px 30px rgba(23, 58, 43, 0.075) !important;
          text-decoration: none !important;
        }

        .home-search-icon {
          width: 34px !important;
          height: 34px !important;
          flex: 0 0 34px !important;
          display: grid !important;
          place-items: center !important;
          border-radius: 11px !important;
          background: #edf6f1 !important;
          color: #096745 !important;
          font-size: 20px !important;
          font-weight: 850 !important;
        }

        .home-search-copy {
          min-width: 0 !important;
          display: grid !important;
          gap: 2px !important;
        }

        .home-search-copy strong {
          color: #1d3429 !important;
          font-size: 12px !important;
          font-weight: 850 !important;
        }

        .home-search-copy small {
          color: #849089 !important;
          font-size: 9px !important;
          white-space: nowrap !important;
        }

        .home-action,
        .home-action:visited {
          min-height: 54px !important;
          box-sizing: border-box !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 7px !important;
          padding: 0 19px !important;
          border-radius: 16px !important;
          text-decoration: none !important;
          font-size: 13px !important;
          font-weight: 850 !important;
        }

        .home-action-primary,
        .home-action-primary:visited {
          background: #086240 !important;
          color: #ffffff !important;
          box-shadow: 0 12px 28px rgba(8, 98, 64, 0.17) !important;
        }

        .home-hero {
          margin-bottom: 26px !important;
        }

        /*
         * Real Build 97 desktop architecture:
         * Local World | Social Feed | Context
         */
        .home-social-shell {
          display: grid !important;
          grid-template-columns:
            220px
            minmax(0, 1fr)
            320px !important;
          gap: 22px !important;
          align-items: start !important;
          width: 100% !important;
        }

        .home-main-column {
          min-width: 0 !important;
          grid-column: 2 !important;
        }

        .home-local-rail {
          min-width: 0 !important;
          grid-column: 1 !important;
          grid-row: 1 !important;
          display: grid !important;
          gap: 14px !important;
          position: sticky !important;
          top: 24px !important;
          align-self: start !important;
        }

        .home-right-rail {
          min-width: 0 !important;
          grid-column: 3 !important;
          grid-row: 1 !important;
          display: grid !important;
          gap: 16px !important;
          position: sticky !important;
          top: 24px !important;
          align-self: start !important;
        }

        /*
         * Local World
         */
        .home-local-card {
          box-sizing: border-box !important;
          padding: 18px !important;
          border: 1px solid rgba(18, 48, 38, 0.075) !important;
          border-radius: 20px !important;
          background:
            radial-gradient(circle at 100% 0%, rgba(15, 115, 76, 0.08), transparent 42%),
            linear-gradient(145deg, #ffffff, #f7faf8) !important;
          box-shadow: 0 12px 34px rgba(19, 45, 34, 0.045) !important;
        }

        .home-local-kicker,
        .home-local-section-label {
          display: block !important;
          color: #829088 !important;
          font-size: 9px !important;
          font-weight: 900 !important;
          letter-spacing: 0.14em !important;
        }

        .home-local-identity > strong {
          display: block !important;
          margin-top: 10px !important;
          color: #102019 !important;
          font-size: 17px !important;
          line-height: 1.2 !important;
          letter-spacing: -0.025em !important;
        }

        .home-local-identity > span {
          display: block !important;
          margin-top: 5px !important;
          color: #78857e !important;
          font-size: 11px !important;
        }

        .home-local-status {
          display: flex !important;
          align-items: center !important;
          gap: 7px !important;
          margin-top: 15px !important;
          color: #527064 !important;
          font-size: 10px !important;
          font-weight: 750 !important;
        }

        .home-live-dot {
          width: 7px !important;
          height: 7px !important;
          flex: 0 0 7px !important;
          border-radius: 999px !important;
          background: #0a8b59 !important;
          box-shadow: 0 0 0 4px rgba(10, 139, 89, 0.1) !important;
        }

        .home-local-nav {
          display: grid !important;
          gap: 4px !important;
          padding: 7px !important;
          border: 1px solid rgba(18, 48, 38, 0.075) !important;
          border-radius: 20px !important;
          background: #ffffff !important;
          box-shadow: 0 12px 34px rgba(19, 45, 34, 0.04) !important;
        }

        .home-local-nav a,
        .home-local-nav a:visited {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          min-width: 0 !important;
          padding: 10px !important;
          border-radius: 14px !important;
          color: #263b32 !important;
          text-decoration: none !important;
          transition:
            background 0.16s ease,
            transform 0.16s ease !important;
        }

        .home-local-nav a:hover {
          background: #f2f7f4 !important;
          color: #263b32 !important;
          text-decoration: none !important;
          transform: translateX(2px) !important;
        }

        .home-local-nav a > span {
          width: 31px !important;
          height: 31px !important;
          flex: 0 0 31px !important;
          display: grid !important;
          place-items: center !important;
          border-radius: 10px !important;
          background: #edf6f1 !important;
          color: #08704a !important;
          font-size: 14px !important;
          font-weight: 850 !important;
        }

        .home-local-nav a > div {
          min-width: 0 !important;
        }

        .home-local-nav strong,
        .home-local-nav small {
          display: block !important;
        }

        .home-local-nav strong {
          color: #21372d !important;
          font-size: 11px !important;
          font-weight: 850 !important;
        }

        .home-local-nav small {
          margin-top: 2px !important;
          color: #8b9690 !important;
          font-size: 8px !important;
          line-height: 1.3 !important;
        }

        .home-local-events {
          min-width: 0 !important;
        }

        .home-local-events .home-local-section-label {
          margin: 0 3px 8px !important;
        }

        .home-local-events .event-module {
          padding: 15px !important;
          border-radius: 18px !important;
        }

        .home-local-events .event-header h2 {
          font-size: 15px !important;
        }

        .home-local-events .event-header p,
        .home-local-events .event-header > a {
          display: none !important;
        }

        .home-local-signature {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 8px 9px !important;
          color: #63736b !important;
        }

        .home-local-signature > span {
          width: 30px !important;
          height: 30px !important;
          flex: 0 0 30px !important;
          display: grid !important;
          place-items: center !important;
          border-radius: 10px !important;
          background: #07583a !important;
          color: #ffffff !important;
          font-size: 11px !important;
          font-weight: 950 !important;
        }

        .home-local-signature strong,
        .home-local-signature small {
          display: block !important;
        }

        .home-local-signature strong {
          color: #30463b !important;
          font-size: 10px !important;
        }

        .home-local-signature small {
          color: #97a09b !important;
          font-size: 8px !important;
        }

        /*
         * Main social stream
         */
        .home-section-heading {
          display: flex !important;
          align-items: flex-end !important;
          justify-content: space-between !important;
          gap: 18px !important;
          margin: 3px 3px 14px !important;
        }

        .home-section-heading span {
          display: block !important;
          color: #102019 !important;
          font-size: 20px !important;
          font-weight: 880 !important;
          letter-spacing: -0.03em !important;
        }

        .home-section-heading p {
          margin: 4px 0 0 !important;
          color: #7a8781 !important;
          font-size: 11px !important;
        }

        .home-section-heading > a,
        .home-section-heading > a:visited {
          color: #0b6846 !important;
          font-size: 11px !important;
          font-weight: 850 !important;
          text-decoration: none !important;
        }

        .home-section-spacing {
          margin-top: 28px !important;
        }

        .home-social-pulse {
          margin-top: 18px !important;
        }

        .home-inbox-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 18px !important;
        }

        /*
         * Context rail
         */
        .home-rail-card {
          box-sizing: border-box !important;
          padding: 19px !important;
          border: 1px solid rgba(17, 48, 37, 0.075) !important;
          border-radius: 20px !important;
          background: #ffffff !important;
          box-shadow: 0 12px 34px rgba(19, 45, 34, 0.045) !important;
        }

        .home-profile-card {
          padding: 7px !important;
        }

        .home-rail-label {
          margin: 15px 15px -2px !important;
          color: #84928b !important;
          font-size: 9px !important;
          font-weight: 900 !important;
          letter-spacing: 0.14em !important;
        }

        .home-profile-link,
        .home-profile-link:visited {
          min-height: 42px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 12px !important;
          margin: 3px 10px 10px !important;
          padding: 0 12px !important;
          border-radius: 12px !important;
          background: #f4f8f6 !important;
          color: #28503e !important;
          text-decoration: none !important;
          font-size: 11px !important;
          font-weight: 800 !important;
        }

        .home-profile-link:hover {
          background: #edf5f1 !important;
          color: #28503e !important;
          text-decoration: none !important;
        }

        .home-profile-link > span {
          color: #08704a !important;
          font-size: 20px !important;
        }

        .home-rail-kicker {
          margin-bottom: 4px !important;
          color: #8c9892 !important;
          font-size: 8px !important;
          font-weight: 900 !important;
          letter-spacing: 0.14em !important;
        }

        .home-rail-heading {
          color: #102019 !important;
          font-size: 17px !important;
          font-weight: 880 !important;
        }

        .home-quick-actions {
          display: grid !important;
          gap: 6px !important;
        }

        .home-quick-actions a,
        .home-quick-actions a:visited {
          min-height: 54px !important;
          display: flex !important;
          align-items: center !important;
          gap: 11px !important;
          padding: 7px 9px !important;
          border-radius: 14px !important;
          color: #273a32 !important;
          text-decoration: none !important;
        }

        .home-quick-actions a:hover {
          background: #f5f8f6 !important;
          color: #273a32 !important;
          text-decoration: none !important;
        }

        .home-quick-actions > a > span {
          width: 34px !important;
          height: 34px !important;
          flex: 0 0 34px !important;
          display: grid !important;
          place-items: center !important;
          border-radius: 11px !important;
          background: #edf6f1 !important;
          color: #08704a !important;
          font-size: 16px !important;
          font-weight: 850 !important;
        }

        .home-quick-actions a > div {
          min-width: 0 !important;
          display: grid !important;
          gap: 2px !important;
        }

        .home-quick-actions strong {
          display: block !important;
          color: #21372d !important;
          font-size: 11px !important;
          font-weight: 820 !important;
        }

        .home-quick-actions small {
          display: block !important;
          color: #86918b !important;
          font-size: 9px !important;
          line-height: 1.35 !important;
        }

        .home-rail-note {
          display: flex !important;
          align-items: flex-start !important;
          gap: 12px !important;
          padding: 16px !important;
          border: 1px solid rgba(18, 48, 38, 0.07) !important;
          border-radius: 18px !important;
          background:
            radial-gradient(circle at 100% 0%, rgba(13, 111, 73, 0.08), transparent 42%),
            linear-gradient(145deg, #f5f9f7, #edf5f1) !important;
        }

        .home-rail-note-mark {
          width: 34px !important;
          height: 34px !important;
          flex: 0 0 34px !important;
          display: grid !important;
          place-items: center !important;
          border-radius: 11px !important;
          background: #07583a !important;
          color: #ffffff !important;
          font-size: 12px !important;
          font-weight: 900 !important;
        }

        .home-rail-note strong {
          color: #20372d !important;
          font-size: 11px !important;
          font-weight: 850 !important;
        }

        .home-rail-note p {
          margin: 5px 0 0 !important;
          color: #728179 !important;
          font-size: 9px !important;
          line-height: 1.55 !important;
        }

        /*
         * Feed links must never fall back to browser purple.
         */
        .neighbour-feed a,
        .neighbour-feed a:visited {
          text-decoration: none !important;
        }

        .neighbour-feed-community-link,
        .neighbour-feed-community-link:visited {
          color: #315247 !important;
        }

        .neighbour-composer,
        .neighbour-composer:visited {
          color: inherit !important;
        }

        .neighbour-composer-tools a,
        .neighbour-composer-tools a:visited {
          color: #60736a !important;
        }

        .neighbour-composer-tools a:hover {
          color: #08704a !important;
        }

        .neighbour-feed-empty > a,
        .neighbour-feed-empty > a:visited {
          color: #ffffff !important;
        }

        .neighbour-post-actions a,
        .neighbour-post-actions a:visited {
          color: #65766d !important;
        }

        .neighbour-post-actions a:hover {
          color: #08704a !important;
        }

        .neighbour-feed-more,
        .neighbour-feed-more:visited {
          color: #315247 !important;
        }

        /*
         * Responsive ownership.
         */
        @media (min-width: 1500px) {
          .home-social-shell {
            grid-template-columns:
              230px
              minmax(0, 1fr)
              330px !important;
            gap: 24px !important;
          }
        }

        @media (max-width: 1320px) {
          .home-social-shell {
            grid-template-columns:
              190px
              minmax(0, 1fr)
              292px !important;
            gap: 18px !important;
          }

          .home-search-action {
            min-width: 220px !important;
          }
        }

        @media (max-width: 1120px) {
          .home-social-shell {
            grid-template-columns:
              minmax(0, 1fr)
              292px !important;
          }

          .home-local-rail {
            display: none !important;
          }

          .home-main-column {
            grid-column: 1 !important;
          }

          .home-right-rail {
            grid-column: 2 !important;
          }
        }

        @media (max-width: 1020px) {
          .home-social-shell {
            grid-template-columns: 1fr !important;
          }

          .home-main-column,
          .home-right-rail {
            grid-column: 1 !important;
          }

          .home-right-rail {
            position: static !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .home-rail-note {
            grid-column: 1 / -1 !important;
          }

          .home-topbar {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .home-top-actions {
            width: 100% !important;
          }

          .home-search-action {
            flex: 1 !important;
          }
        }

        @media (max-width: 768px) {
          .home-page {
            width: min(100% - 28px, 680px) !important;
            padding: 22px 0 100px !important;
          }

          .home-topbar {
            padding: 20px !important;
          }

          .home-top-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .home-search-action {
            width: 100% !important;
            min-width: 0 !important;
          }

          .home-action {
            width: 100% !important;
          }

          .home-inbox-grid,
          .home-right-rail {
            grid-template-columns: 1fr !important;
          }

          .home-rail-note {
            grid-column: auto !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-search-action,
          .home-local-nav a,
          .home-action {
            transition: none !important;
          }
        }
      `}</style>

      <style jsx global>{`
        /*
         * BUILD 97D — PREMIUM VISUAL POLISH
         */

        .home-page {
          width: min(100% - 52px, 1580px) !important;
        }

        /*
         * Feed becomes the dominant desktop surface.
         */
        .home-social-shell {
          grid-template-columns:
            198px
            minmax(0, 1fr)
            238px !important;
          gap: 18px !important;
        }

        /*
         * Identity hero — no second time-based greeting.
         */
        .home-identity-hero {
          position: relative !important;
          overflow: hidden !important;
          display: grid !important;
          grid-template-columns: auto minmax(0, 1fr) auto !important;
          align-items: center !important;
          gap: 17px !important;
          min-height: 104px !important;
          box-sizing: border-box !important;
          padding: 21px 24px !important;
          border: 1px solid rgba(255, 255, 255, 0.07) !important;
          border-radius: 24px !important;
          background:
            radial-gradient(circle at 86% -25%, rgba(72, 181, 132, 0.23), transparent 32%),
            radial-gradient(circle at 4% 120%, rgba(17, 109, 76, 0.31), transparent 34%),
            linear-gradient(130deg, #082d22 0%, #073e2d 50%, #075339 100%) !important;
          box-shadow:
            0 20px 52px rgba(6, 45, 31, 0.14),
            inset 0 1px rgba(255, 255, 255, 0.04) !important;
        }

        .home-identity-hero::after {
          content: '' !important;
          position: absolute !important;
          width: 220px !important;
          height: 220px !important;
          right: -90px !important;
          bottom: -150px !important;
          border: 1px solid rgba(255, 255, 255, 0.07) !important;
          border-radius: 999px !important;
          pointer-events: none !important;
        }

        .home-identity-avatar {
          width: 60px !important;
          height: 60px !important;
          display: grid !important;
          place-items: center !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 19px !important;
          background:
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.16), transparent 35%),
            linear-gradient(145deg, #1d8b62, #0a5f43) !important;
          color: #ffffff !important;
          font-size: 18px !important;
          font-weight: 950 !important;
          letter-spacing: -0.02em !important;
          box-shadow:
            0 12px 26px rgba(0, 0, 0, 0.15),
            inset 0 1px rgba(255, 255, 255, 0.12) !important;
        }

        .home-identity-copy {
          min-width: 0 !important;
        }

        .home-identity-kicker {
          margin-bottom: 5px !important;
          color: rgba(220, 242, 230, 0.64) !important;
          font-size: 8px !important;
          font-weight: 900 !important;
          letter-spacing: 0.16em !important;
        }

        .home-identity-name-row {
          display: flex !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          gap: 9px !important;
        }

        .home-identity-name-row h2 {
          margin: 0 !important;
          color: #ffffff !important;
          font-size: clamp(20px, 2vw, 27px) !important;
          font-weight: 900 !important;
          line-height: 1.05 !important;
          letter-spacing: -0.04em !important;
        }

        .home-identity-live {
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          padding: 4px 7px !important;
          border: 1px solid rgba(185, 238, 209, 0.15) !important;
          border-radius: 999px !important;
          background: rgba(255, 255, 255, 0.07) !important;
          color: #c4eed7 !important;
          font-size: 7px !important;
          font-weight: 850 !important;
          letter-spacing: 0.06em !important;
          text-transform: uppercase !important;
        }

        .home-identity-live > span {
          width: 5px !important;
          height: 5px !important;
          border-radius: 999px !important;
          background: #69e29e !important;
          box-shadow: 0 0 0 3px rgba(105, 226, 158, 0.1) !important;
        }

        .home-identity-copy > p {
          display: flex !important;
          align-items: center !important;
          gap: 5px !important;
          margin: 7px 0 0 !important;
          color: rgba(231, 245, 237, 0.72) !important;
          font-size: 10px !important;
          font-weight: 650 !important;
        }

        .home-identity-copy > p > span {
          color: #74d59f !important;
        }

        .home-identity-community {
          min-width: 175px !important;
          display: grid !important;
          gap: 3px !important;
          padding: 10px 13px !important;
          border: 1px solid rgba(255, 255, 255, 0.075) !important;
          border-radius: 15px !important;
          background: rgba(255, 255, 255, 0.055) !important;
          backdrop-filter: blur(12px) !important;
        }

        .home-identity-community small {
          color: rgba(211, 238, 224, 0.57) !important;
          font-size: 7px !important;
          font-weight: 900 !important;
          letter-spacing: 0.11em !important;
        }

        .home-identity-community strong {
          overflow: hidden !important;
          color: #ffffff !important;
          font-size: 11px !important;
          font-weight: 850 !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        .home-identity-community span {
          color: rgba(225, 242, 233, 0.66) !important;
          font-size: 8px !important;
        }

        /*
         * Local World rail.
         */
        .home-local-rail {
          gap: 11px !important;
        }

        .home-local-card {
          padding: 15px !important;
          border-radius: 18px !important;
        }

        .home-local-identity > strong {
          margin-top: 8px !important;
          font-size: 14px !important;
        }

        .home-local-identity > span {
          font-size: 9px !important;
        }

        .home-local-status {
          margin-top: 11px !important;
          font-size: 8px !important;
        }

        .home-local-nav {
          gap: 2px !important;
          padding: 5px !important;
          border-radius: 18px !important;
        }

        .home-local-nav a,
        .home-local-nav a:visited {
          gap: 8px !important;
          min-height: 42px !important;
          box-sizing: border-box !important;
          padding: 6px 7px !important;
          border-radius: 12px !important;
        }

        .home-local-nav a > span {
          width: 29px !important;
          height: 29px !important;
          flex: 0 0 29px !important;
          border-radius: 9px !important;
          font-size: 13px !important;
        }

        .home-local-nav strong {
          font-size: 10px !important;
        }

        .home-local-nav small {
          font-size: 7px !important;
        }

        .home-local-events .event-module {
          padding: 13px !important;
          border-radius: 17px !important;
        }

        .home-local-events .event-header h2 {
          font-size: 13px !important;
        }

        /*
         * Community Pulse stays useful but stops competing with feed.
         */
        .home-social-pulse {
          margin-top: 14px !important;
          opacity: 0.96 !important;
        }

        .home-social-pulse section,
        .home-social-pulse article {
          border-radius: 18px !important;
          box-shadow: 0 9px 28px rgba(18, 46, 35, 0.035) !important;
        }

        /*
         * Right context rail.
         */
        .home-right-rail {
          gap: 11px !important;
        }

        .home-rail-card {
          padding: 14px !important;
          border-radius: 17px !important;
          box-shadow: 0 9px 28px rgba(19, 45, 34, 0.035) !important;
        }

        .home-profile-card {
          padding: 5px !important;
        }

        .home-rail-label {
          margin: 12px 12px -2px !important;
          font-size: 7px !important;
        }

        .home-profile-link,
        .home-profile-link:visited {
          min-height: 36px !important;
          margin: 2px 7px 7px !important;
          padding: 0 10px !important;
          border-radius: 10px !important;
          font-size: 9px !important;
        }

        .home-rail-heading {
          font-size: 14px !important;
        }

        .home-quick-actions {
          gap: 3px !important;
        }

        .home-quick-actions a,
        .home-quick-actions a:visited {
          min-height: 44px !important;
          gap: 8px !important;
          padding: 5px 6px !important;
          border-radius: 11px !important;
        }

        .home-quick-actions > a > span {
          width: 29px !important;
          height: 29px !important;
          flex: 0 0 29px !important;
          border-radius: 9px !important;
          font-size: 13px !important;
        }

        .home-quick-actions strong {
          font-size: 9px !important;
        }

        .home-quick-actions small {
          font-size: 7px !important;
        }

        .home-rail-note {
          gap: 9px !important;
          padding: 12px !important;
          border-radius: 15px !important;
        }

        .home-rail-note-mark {
          width: 30px !important;
          height: 30px !important;
          flex: 0 0 30px !important;
          border-radius: 9px !important;
        }

        /*
         * Unified keyboard interaction.
         */
        .home-page a:focus-visible,
        .home-page button:focus-visible {
          outline: 3px solid rgba(20, 126, 83, 0.24) !important;
          outline-offset: 3px !important;
        }

        @media (min-width: 1500px) {
          .home-social-shell {
            grid-template-columns:
              205px
              minmax(0, 1fr)
              242px !important;
            gap: 20px !important;
          }
        }

        @media (max-width: 1320px) {
          .home-social-shell {
            grid-template-columns:
              178px
              minmax(0, 1fr)
              224px !important;
            gap: 14px !important;
          }

          .home-identity-community {
            min-width: 150px !important;
          }
        }

        @media (max-width: 1120px) {
          .home-social-shell {
            grid-template-columns:
              minmax(0, 1fr)
              250px !important;
          }

          .home-local-rail {
            display: none !important;
          }
        }

        @media (max-width: 1020px) {
          .home-social-shell {
            grid-template-columns: 1fr !important;
          }

          .home-right-rail {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .home-identity-hero {
            grid-template-columns: auto minmax(0, 1fr) !important;
          }

          .home-identity-community {
            grid-column: 1 / -1 !important;
            min-width: 0 !important;
          }
        }

        @media (max-width: 680px) {
          .home-identity-hero {
            padding: 17px !important;
            border-radius: 20px !important;
          }

          .home-identity-avatar {
            width: 50px !important;
            height: 50px !important;
            border-radius: 16px !important;
          }

          .home-identity-name-row h2 {
            font-size: 20px !important;
          }

          .home-identity-community {
            grid-column: 1 / -1 !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-page *,
          .home-page *::before,
          .home-page *::after {
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
