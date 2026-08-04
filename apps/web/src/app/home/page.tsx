'use client';

import { useEffect, useState } from 'react';

import { apiRequest, getMyProfile } from '@neighbour/api-client';

import {
  NeighbourAvatar,
  NeighbourBadge,
  NeighbourButton,
  NeighbourCard,
} from '@neighbour/design-system';

import PageContainer from '../../components/layout/PageContainer';
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
import DashboardGrid from '../../components/dashboard/layout/DashboardGrid';
import DashboardSection from '../../components/dashboard/layout/DashboardSection';

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
        setMessage('Unable to load your profile.');
      }
    }

    load();
  }, []);

  if (!user) {
    return (
      <PageContainer>
        <NeighbourCard>
          <h2>{message}</h2>
        </NeighbourCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1>Neighbour™</h1>

      <h2>Good evening {user.displayName} 👋</h2>

      <NeighbourHeader name={user.displayName} area={profile?.localArea ?? null} />

      <ProfileSummary name={user.displayName} bio={profile?.bio} />

      <CommunityPulse area={profile?.localArea ?? null} />

      <CommunityIdentity
        neighbourhoodName={context?.neighbourhoodName ?? null}
        communityName={context?.communityName ?? null}
      />

      <CommunityStats
        communityName={context?.communityName ?? null}
        memberCount={context?.communityMemberCount ?? null}
      />

      <CommunityActivity
        memberCount={context?.communityMemberCount ?? null}
        postCount={activity?.postCount ?? 0}
        eventCount={activity?.eventCount ?? 0}
        conversationCount={activity?.conversationCount ?? 0}
      />

      <ActionCentre />

      <FeedPreview
        token={localStorage.getItem('accessToken') ?? ''}
        communitySlug={context?.communitySlug ?? undefined}
      />

      <EventPreview communityId={context?.communityId ?? undefined} />

      <MessagePreview token={localStorage.getItem('accessToken') ?? ''} />

      <NotificationPreview token={localStorage.getItem('accessToken') ?? ''} />

      <NeighbourCard>
        <h2>Your Community</h2>

        <p>{profile?.localArea ?? 'Find neighbours near you'}</p>

        <NeighbourButton>Explore Community</NeighbourButton>
      </NeighbourCard>

      <NeighbourCard>
        <h2>Community Activity</h2>

        <p>No posts yet.</p>

        <p>Be the first neighbour to share something.</p>

        <NeighbourButton variant="secondary">Create Post</NeighbourButton>
      </NeighbourCard>

      <NeighbourCard>
        <h2>Upcoming Events</h2>

        <p>Discover local events happening nearby.</p>
      </NeighbourCard>
    </PageContainer>
  );
}
