import {
  ApiClientError,
  createProfile,
  getMyCommunities,
  getMyMarketplaceBusiness,
  getMyProfile,
  getMyTrustIntelligence,
  getMyTrustProfile,
  updateMyProfile,
  type PrivateProfile,
  type UpdateProfileInput,
} from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ProfileHubData } from '../types';

const EMPTY_DATA: ProfileHubData = {
  profile: null,
  memberships: [],
  business: null,
  trustProfile: null,
  trustIntelligence: null,
};

export function useProfileHub() {
  const [data, setData] = useState<ProfileHubData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const profileResult = await getMyProfile().catch((caughtError) => {
        if (caughtError instanceof ApiClientError && caughtError.status === 404) {
          return null;
        }

        throw caughtError;
      });

      const [memberships, business, trustProfile, trustIntelligence] = await Promise.all([
        getMyCommunities().catch(() => []),
        getMyMarketplaceBusiness().catch(() => null),
        getMyTrustProfile().catch(() => null),
        getMyTrustIntelligence().catch(() => null),
      ]);

      setData({
        profile: profileResult,
        memberships,
        business,
        trustProfile,
        trustIntelligence,
      });
    } catch {
      setError('Your profile could not be loaded. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (
      input: UpdateProfileInput & {
        username: string;
      },
    ): Promise<PrivateProfile | null> => {
      setSaving(true);
      setError(null);

      try {
        const saved = data.profile
          ? await updateMyProfile(input)
          : await createProfile({
              username: input.username,
              ...(input.bio
                ? {
                    bio: input.bio,
                  }
                : {}),
              ...(input.localArea
                ? {
                    localArea: input.localArea,
                  }
                : {}),
            });

        setData((current) => ({
          ...current,
          profile: {
            ...saved,
            showLocalArea:
              'showLocalArea' in saved ? saved.showLocalArea : (input.showLocalArea ?? false),
          },
        }));

        return saved;
      } catch (caughtError) {
        if (caughtError instanceof ApiClientError && caughtError.status === 409) {
          setError('That username is already in use.');
        } else if (caughtError instanceof ApiClientError && caughtError.status === 400) {
          setError(
            'Check your profile details. Usernames use 3–30 letters, numbers, dots or underscores.',
          );
        } else {
          setError('Your profile changes could not be saved.');
        }

        return null;
      } finally {
        setSaving(false);
      }
    },
    [data.profile],
  );

  const completionScore = useMemo(() => {
    const profile = data.profile;

    if (!profile) {
      return 0;
    }

    let score = 25;

    if (profile.displayName) score += 20;
    if (profile.avatarUrl) score += 20;
    if (profile.bio) score += 15;
    if (profile.localArea) score += 10;
    if (profile.showLocalArea) score += 10;

    return Math.min(100, score);
  }, [data.profile]);

  const badges = useMemo(() => {
    const result: string[] = [];

    if (data.trustIntelligence?.signals.verified) {
      result.push('Verified');
    }

    if (data.memberships.length > 0) {
      result.push('Community Member');
    }

    if (
      data.memberships.some(
        (membership) =>
          membership.role === 'OWNER' ||
          membership.role === 'ADMIN' ||
          membership.role === 'MODERATOR',
      )
    ) {
      result.push('Community Leader');
    }

    if (data.business) {
      result.push('Business Owner');
    }

    return result;
  }, [data.business, data.memberships, data.trustIntelligence]);

  return {
    ...data,
    completionScore,
    badges,
    loading,
    refreshing,
    saving,
    error,
    refresh: () => load(true),
    retry: () => load(false),
    save,
  };
}
