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

const NEW_COMMUNITY_RETRY_DELAYS = [250, 500, 1000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getCommunityWithRetry(slug: string): Promise<Community> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= NEW_COMMUNITY_RETRY_DELAYS.length; attempt += 1) {
    try {
      return await getCommunity(slug);
    } catch (error) {
      lastError = error;

      const shouldRetry =
        error instanceof ApiClientError &&
        (error.status === 404 || error.status === 429 || error.status >= 500) &&
        attempt < NEW_COMMUNITY_RETRY_DELAYS.length;

      if (!shouldRetry) {
        throw error;
      }

      await sleep(NEW_COMMUNITY_RETRY_DELAYS[attempt]);
    }
  }

  throw lastError;
}

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
        /*
         * The community itself is the critical resource.
         *
         * A newly-created community may be navigated to immediately after
         * creation, so tolerate a very short read-after-write window.
         */
        const communityResult = await getCommunityWithRetry(slug);

        /*
         * Render the community as soon as the critical request succeeds.
         * Supplementary resources must not make the whole community appear
         * unavailable.
         */
        setCommunity(communityResult);

        const memberships = await getMyCommunities().catch(() => []);

        const currentMembership =
          memberships.find((item) => item.community.id === communityResult.id) ?? null;

        setMembership(currentMembership);

        if (currentMembership) {
          setCommunity(currentMembership.community);
        }

        const [feedResult, eventResult, businessResult] = await Promise.allSettled([
          getCommunityFeed(slug, {
            limit: 30,
          }),
          getCommunityEvents(communityResult.id),
          getCommunityBusinesses(communityResult.id),
        ]);

        if (feedResult.status === 'fulfilled') {
          setPosts(feedResult.value.items);
        } else {
          setPosts([]);
        }

        if (eventResult.status === 'fulfilled') {
          setEvents(eventResult.value);
        } else {
          setEvents([]);
        }

        if (businessResult.status === 'fulfilled') {
          setBusinesses(businessResult.value);
        } else {
          setBusinesses([]);
        }
      } catch (caughtError) {
        setCommunity(null);

        if (caughtError instanceof ApiClientError && caughtError.status === 404) {
          setError('This community could not be found.');
        } else if (caughtError instanceof ApiClientError && caughtError.status === 429) {
          setError('Neighbour is receiving too many requests. Please try again.');
        } else {
          setError('This community could not be loaded.');
        }
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

  const refresh = useCallback(() => load(true), [load]);
  const retry = useCallback(() => load(false), [load]);

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
    refresh,
    retry,
    join,
    leave,
  };
}
