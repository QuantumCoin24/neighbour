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

      <section className="home-hero">
        <NeighbourHeader name={user.displayName} area={profile?.localArea ?? null} />
      </section>

      <section className="home-layout">
        <div className="home-main-column">
          <div className="home-section-heading">
            <div>
              <span>Your neighbourhood</span>
              <p>Latest conversations, updates and moments from around you.</p>
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
