import { apiRequest } from './client';

export interface MediaAsset {
  id: string;
  ownerId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export function getMyMedia(token: string) {
  return apiRequest<MediaAsset[]>('/media/mine', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
