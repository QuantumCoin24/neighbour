import {
  getCommunity,
  getCommunityBusinesses,
  getCommunityEvents,
  getCommunityFeed,
  getMyCommunities,
  joinCommunity,
  type Business,
  type Community,
  type CommunityMembership,
  type EventItem,
  type FeedPost,
} from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useCommunityDetail(slug: string) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [communityResult, memberships] = await Promise.all([
          getCommunity(slug),
          getMyCommunities(),
        ]);

        const currentMembership =
          memberships.find((item) => item.community.id === communityResult.id) ?? null;

        const [feedResult, eventResult, businessResult] = await Promise.all([
          getCommunityFeed(slug, {
            limit: 30,
          }),
          getCommunityEvents(communityResult.id),
          getCommunityBusinesses(communityResult.id),
        ]);

        setCommunity(currentMembership?.community ?? communityResult);
        setMembership(currentMembership);
        setPosts(feedResult.items);
        setEvents(eventResult);
        setBusinesses(businessResult);
      } catch {
        setError('This community could not be loaded.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const join = useCallback(async () => {
    if (!community || membership || joining) {
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const created = await joinCommunity(community.slug);

      setMembership(created);
      setCommunity(created.community);
    } catch {
      setError('This community could not be joined.');
    } finally {
      setJoining(false);
    }
  }, [community, joining, membership]);

  const roleLabel = useMemo(() => {
    if (!membership) {
      return null;
    }

    return membership.role.charAt(0) + membership.role.slice(1).toLocaleLowerCase();
  }, [membership]);

  return {
    community,
    membership,
    roleLabel,
    posts,
    events,
    businesses,
    loading,
    refreshing,
    joining,
    error,
    refresh: () => load(true),
    retry: () => load(false),
    join,
  };
}
