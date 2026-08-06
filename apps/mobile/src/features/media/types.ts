import type { MediaAsset } from '@neighbour/api-client';

export type SupportedImageMimeType =
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';

export type MediaUploadStatus =
  'SELECTED' | 'PREPARING' | 'REQUESTING_UPLOAD' | 'UPLOADING' | 'VERIFYING' | 'READY' | 'FAILED';

export interface PendingMedia {
  localId: string;
  uri: string;
  fileName: string;
  mimeType: SupportedImageMimeType;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface UploadedMedia {
  localId: string;
  asset: MediaAsset;
}

export interface MediaUploadProgress {
  localId: string;
  mediaId?: string;
  progress: number;
  status: MediaUploadStatus;
  error?: string;
}

export interface MediaSelectionResult {
  items: PendingMedia[];
  rejectedCount: number;
}
