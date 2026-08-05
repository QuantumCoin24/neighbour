import { apiRequest } from './client';

export type MediaAssetStatus = 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED';

export interface MediaAsset {
  id: string;
  ownerId: string;
  storageKey: string;
  url: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  status: MediaAssetStatus;
  uploadedAt: string | null;
  readyAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadRequest {
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface MediaUploadSession {
  asset: MediaAsset;
  upload: {
    method: 'PUT';
    url: string;
    headers: {
      'Content-Type': string;
    };
    expiresInSeconds: number;
  };
}

export interface PostMedia {
  id: string;
  position: number;
  altText: string | null;
  asset: MediaAsset;
}

export function createMediaUpload(input: MediaUploadRequest): Promise<MediaUploadSession> {
  return apiRequest<MediaUploadSession>('/media/uploads', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function completeMediaUpload(
  mediaId: string,
  input: {
    checksum?: string;
    width?: number;
    height?: number;
  } = {},
): Promise<MediaAsset> {
  return apiRequest<MediaAsset>(`/media/${encodeURIComponent(mediaId)}/complete`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function attachMediaToPost(postId: string, mediaIds: string[]): Promise<PostMedia[]> {
  return apiRequest<PostMedia[]>(`/media/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      mediaIds,
    }),
  });
}

export function getPostMedia(postId: string): Promise<PostMedia[]> {
  return apiRequest<PostMedia[]>(`/media/posts/${encodeURIComponent(postId)}`);
}

export function getMyMedia(): Promise<MediaAsset[]> {
  return apiRequest<MediaAsset[]>('/media/mine');
}

export function deleteMedia(mediaId: string): Promise<void> {
  return apiRequest<void>(`/media/${encodeURIComponent(mediaId)}`, {
    method: 'DELETE',
  });
}
