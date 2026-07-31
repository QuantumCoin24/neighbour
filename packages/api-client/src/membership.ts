import { apiRequest } from "./index";



export interface MembershipCommunity {
  id: string;
  userId: string;
  neighbourhoodId: string;
  createdAt: string;
  community?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
}

export interface Membership {
  id: string;
  userId: string;
  neighbourhoodId: string;
  createdAt: string;
}

export function joinNeighbourhood(
  token: string,
  neighbourhoodId: string,
) {
  return apiRequest<Membership>(
    "/memberships/join",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        neighbourhoodId,
      }),
    },
  );
}

export function getMyMemberships(
  token: string,
) {
  return apiRequest<Membership[]>(
    "/memberships/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
