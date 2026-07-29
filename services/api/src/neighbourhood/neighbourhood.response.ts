export interface NeighbourhoodResponse {
  id: string;
  name: string;
  description: string;
  localArea: string | null;
}

export interface MembershipResponse {
  id: string;
  userId: string;
  neighbourhoodId: string;
}
