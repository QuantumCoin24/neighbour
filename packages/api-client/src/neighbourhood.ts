import { apiRequest } from './client';

export interface Neighbourhood {
  id: string;
  name: string;
  description: string;
  localArea: string | null;
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

export function getNeighbourhoods(): Promise<Neighbourhood[]>;
export function getNeighbourhoods(token: string): Promise<Neighbourhood[]>;
export function getNeighbourhoods(token?: string): Promise<Neighbourhood[]> {
  return apiRequest<Neighbourhood[]>('/neighbourhoods', {
    headers: tokenHeaders(token),
  });
}
