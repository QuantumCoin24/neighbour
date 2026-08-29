import {
  ApiClientError,
  getCommunities,
  getMyCommunities,
  getMyProfile,
  getNearbyGeoItems,
  joinCommunity,
  resolvePostalLocation,
  type Community,
  type CommunityMembership,
} from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type CommunityDiscoveryMode = 'nearby' | 'everywhere';

const DEFAULT_RADIUS_KM = 10;

export function useCommunityDirectory() {
  const [publicCommunities, setPublicCommunities] = useState<Community[]>([]);
  const [memberships, setMemberships] = useState<CommunityMembership[]>([]);
  const [query, setQuery] = useState('');
  const [discoveryMode, setDiscoveryMode] = useState<CommunityDiscoveryMode>('nearby');
  const [nearbyIds, setNearbyIds] = useState<string[]>([]);
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningSlug, setJoiningSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [communities, mine] = await Promise.all([getCommunities(), getMyCommunities()]);

      setPublicCommunities(communities);
      setMemberships(mine);

      try {
        const profile = await getMyProfile();

        let point: { latitude: number; longitude: number } | null = null;

        if (typeof profile.latitude === 'number' && typeof profile.longitude === 'number') {
          point = {
            latitude: profile.latitude,
            longitude: profile.longitude,
          };
        } else if (profile.postalCode?.trim()) {
          const postal = await resolvePostalLocation({
            countryCode: profile.countryCode?.trim() || 'GB',
            postalCode: profile.postalCode.trim(),
          });

          if (
            postal.resolved &&
            typeof postal.latitude === 'number' &&
            typeof postal.longitude === 'number'
          ) {
            point = {
              latitude: postal.latitude,
              longitude: postal.longitude,
            };
          }
        }

        if (point) {
          const nearby = await getNearbyGeoItems({
            ...point,
            radiusKm: DEFAULT_RADIUS_KM,
            types: ['COMMUNITY'],
            limit: 200,
          });

          setNearbyIds(nearby.items.map((item) => item.id));
          setLocationAvailable(true);
        } else {
          setNearbyIds([]);
          setLocationAvailable(false);
          setDiscoveryMode('everywhere');
        }
      } catch {
        setNearbyIds([]);
        setLocationAvailable(false);
        setDiscoveryMode('everywhere');
      }
    } catch {
      setError('Communities could not be loaded. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const membershipByCommunityId = useMemo(
    () => new Map(memberships.map((membership) => [membership.community.id, membership])),
    [memberships],
  );

  const allItems = useMemo(() => {
    const known = new Map<
      string,
      {
        community: Community;
        membership: CommunityMembership | null;
      }
    >();

    for (const community of publicCommunities) {
      known.set(community.id, {
        community,
        membership: membershipByCommunityId.get(community.id) ?? null,
      });
    }

    for (const membership of memberships) {
      known.set(membership.community.id, {
        community: membership.community,
        membership,
      });
    }

    return [...known.values()].sort((left, right) => {
      const leftJoined = left.membership ? 1 : 0;
      const rightJoined = right.membership ? 1 : 0;

      if (leftJoined !== rightJoined) {
        return rightJoined - leftJoined;
      }

      if (left.community.memberCount !== right.community.memberCount) {
        return right.community.memberCount - left.community.memberCount;
      }

      return left.community.name.localeCompare(right.community.name);
    });
  }, [membershipByCommunityId, memberships, publicCommunities]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();

    if (!term) {
      return allItems;
    }

    return allItems.filter(({ community }) =>
      [community.name, community.slug, community.description ?? ''].some((value) =>
        value.toLocaleLowerCase().includes(term),
      ),
    );
  }, [allItems, query]);

  const joinedItems = useMemo(
    () =>
      filteredItems.filter(
        (item) => item.membership?.status === 'ACTIVE' || item.membership?.status === 'INVITED',
      ),
    [filteredItems],
  );

  const discoverItems = useMemo(() => {
    const discoverable = filteredItems.filter((item) => item.membership === null);

    if (discoveryMode === 'everywhere') {
      return discoverable;
    }

    const nearbyOrder = new Map(nearbyIds.map((id, index) => [id, index]));

    return discoverable
      .filter((item) => nearbyOrder.has(item.community.id))
      .sort(
        (left, right) =>
          (nearbyOrder.get(left.community.id) ?? Number.MAX_SAFE_INTEGER) -
          (nearbyOrder.get(right.community.id) ?? Number.MAX_SAFE_INTEGER),
      );
  }, [discoveryMode, filteredItems, nearbyIds]);
  const join = useCallback(
    async (community: Community) => {
      if (membershipByCommunityId.has(community.id) || joiningSlug) {
        return;
      }

      setJoiningSlug(community.slug);
      setError(null);

      const optimisticMembership: CommunityMembership = {
        id: `optimistic-${community.id}`,
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        community: {
          ...community,
          memberCount: community.memberCount + 1,
        },
      };

      setMemberships((current) => [optimisticMembership, ...current]);

      try {
        const created = await joinCommunity(community.slug);

        setMemberships((current) => [
          created,
          ...current.filter((membership) => membership.community.id !== community.id),
        ]);

        setPublicCommunities((current) =>
          current.map((item) => (item.id === community.id ? created.community : item)),
        );
      } catch (caughtError) {
        setMemberships((current) =>
          current.filter((membership) => membership.id !== optimisticMembership.id),
        );

        if (caughtError instanceof ApiClientError && caughtError.status === 409) {
          await load(true);
        } else {
          setError('This community could not be joined. Please try again.');
        }
      } finally {
        setJoiningSlug(null);
      }
    },
    [joiningSlug, load, membershipByCommunityId],
  );

  const refresh = useCallback(() => load(true), [load]);
  const retry = useCallback(() => load(false), [load]);

  return {
    query,
    setQuery,
    discoveryMode,
    setDiscoveryMode,
    locationAvailable,
    radiusKm: DEFAULT_RADIUS_KM,
    items: filteredItems,
    joinedItems,
    discoverItems,
    memberships,
    loading,
    refreshing,
    joiningSlug,
    error,
    refresh,
    retry,
    join,
  };
}
