import { apiRequest } from "./index";

export interface Neighbourhood {
  id: string;
  name: string;
  description: string;
  localArea: string | null;
}

export function getNeighbourhoods(token: string) {
  return apiRequest<Neighbourhood[]>("/neighbourhoods", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
