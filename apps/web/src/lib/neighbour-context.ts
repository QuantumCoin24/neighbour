import { getNeighbourhoods, getMyCommunities } from '@neighbour/api-client';

export interface NeighbourContext {
  neighbourhoodId: string | null;
  neighbourhoodName: string | null;
  communityId: string | null;
  communityName: string | null;
  communitySlug: string | null;
  communityMemberCount: number | null;
}

export async function getNeighbourContext(
  token: string,
  localArea: string | null,
): Promise<NeighbourContext> {
  const empty: NeighbourContext = {
    neighbourhoodId: null,
    neighbourhoodName: null,
    communityId: null,
    communityName: null,
    communitySlug: null,
    communityMemberCount: null,
  };

  if (!localArea) {
    return empty;
  }

  try {
    const neighbourhoods = await getNeighbourhoods(token);

    const neighbourhood = neighbourhoods.find(
      (item) => item.localArea?.toLowerCase() === localArea.toLowerCase(),
    );

    const communities = await getMyCommunities(token);

    const community = communities.find(
      (item) =>
        item.name?.toLowerCase() === localArea.toLowerCase() ||
        item.slug?.toLowerCase() === localArea.toLowerCase(),
    );

    return {
      neighbourhoodId: neighbourhood?.id ?? null,

      neighbourhoodName: neighbourhood?.name ?? null,

      communityId: community?.id ?? null,

      communityName: community?.name ?? null,

      communitySlug: community?.slug ?? null,

      communityMemberCount: community?.memberCount ?? null,
    };
  } catch {
    return empty;
  }
}
