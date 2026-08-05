import {
  ApiClientError,
  getCommunity,
  getCommunityBusinesses,
  getCommunityEvents,
  getCommunityFeed,
  getMyCommunities,
  joinCommunity,
  leaveCommunity,
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
  const [leaving, setLeaving] = useState(false);
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
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError && caughtError.status === 403) {
        setError('This community can only be joined using an invitation.');
      } else {
        setError('This community could not be joined.');
      }
    } finally {
      setJoining(false);
    }
  }, [community, joining, membership]);

  const leave = useCallback(async () => {
    if (!community || !membership || membership.role === 'OWNER' || leaving) {
      return;
    }

    setLeaving(true);
    setError(null);

    try {
      await leaveCommunity(community.slug);

      setMembership(null);

      setCommunity((current) =>
        current
          ? {
              ...current,
              memberCount: Math.max(0, current.memberCount - 1),
            }
          : current,
      );
    } catch {
      setError('The community could not be left. Please try again.');
    } finally {
      setLeaving(false);
    }
  }, [community, leaving, membership]);

  const prependPost = useCallback((post: FeedPost) => {
    setPosts((current) => [post, ...current.filter((existing) => existing.id !== post.id)]);
  }, []);

  const roleLabel = useMemo(() => {
    if (!membership) {
      return null;
    }

    return membership.role.charAt(0) + membership.role.slice(1).toLowerCase();
  }, [membership]);

  const enabledFeatures = useMemo(
    () =>
      [
        community?.allowMemberPosts ? 'Member posts' : null,
        community?.allowEvents ? 'Events' : null,
        community?.allowBusinesses ? 'Businesses' : null,
        community?.allowMarketplace ? 'Marketplace' : null,
      ].filter((value): value is string => Boolean(value)),
    [community],
  );

  return {
    community,
    membership,
    roleLabel,
    enabledFeatures,
    posts,
    events,
    businesses,
    loading,
    refreshing,
    joining,
    leaving,
    error,
    prependPost,
    refresh: () => load(true),
    retry: () => load(false),
    join,
    leave,
  };
}
