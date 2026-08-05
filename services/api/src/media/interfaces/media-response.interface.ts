export type MediaAssetStatusResponse = 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED';

export interface MediaAssetResponse {
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
  status: MediaAssetStatusResponse;
  uploadedAt: Date | null;
  readyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaUploadResponse {
  asset: MediaAssetResponse;
  upload: {
    method: 'PUT';
    url: string;
    headers: {
      'Content-Type': string;
    };
    expiresInSeconds: number;
  };
}

export interface PostMediaResponse {
  id: string;
  position: number;
  altText: string | null;
  asset: MediaAssetResponse;
}
