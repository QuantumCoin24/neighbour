import { apiRequest } from '../client';

import type { NearbyQuery, NearbyRadiusPreset, NearbyResponse } from './types';

function queryString(input: NearbyQuery): string {
  const query = new URLSearchParams();

  query.set('latitude', String(input.latitude));

  query.set('longitude', String(input.longitude));

  if (input.radiusKm !== undefined) {
    query.set('radiusKm', String(input.radiusKm));
  }

  if (input.sort) {
    query.set('sort', input.sort);
  }

  if (input.limit !== undefined) {
    query.set('limit', String(input.limit));
  }

  if (input.verifiedOnly !== undefined) {
    query.set('verifiedOnly', String(input.verifiedOnly));
  }

  if (input.eventsOnlyUpcoming !== undefined) {
    query.set('eventsOnlyUpcoming', String(input.eventsOnlyUpcoming));
  }

  for (const type of input.types ?? []) {
    query.append('types', type);
  }

  return query.toString();
}

export function getNearby(input: NearbyQuery): Promise<NearbyResponse> {
  return apiRequest<NearbyResponse>(`/nearby?${queryString(input)}`);
}

export function getNearbyRadiusPresets(): Promise<NearbyRadiusPreset[]> {
  return apiRequest<NearbyRadiusPreset[]>('/nearby/radius-presets');
}

export * from './types';
