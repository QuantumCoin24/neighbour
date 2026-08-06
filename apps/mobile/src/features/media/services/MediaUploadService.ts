import {
  completeMediaUpload,
  createMediaUpload,
  deleteMedia,
  type MediaAsset,
} from '@neighbour/api-client';
import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';

import { compressImage } from './ImageCompression';
import type { MediaUploadProgress, PendingMedia, UploadedMedia } from '../types';

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function resolveMimeType(media: PendingMedia): PendingMedia['mimeType'] {
  if (SUPPORTED_MIME_TYPES.has(media.mimeType)) {
    return media.mimeType;
  }

  return 'image/jpeg';
}

function resolveFileName(media: PendingMedia, mimeType: PendingMedia['mimeType']): string {
  if (media.fileName.trim()) {
    return media.fileName.trim();
  }

  const extension: Record<PendingMedia['mimeType'], string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };

  return `neighbour-${media.localId}.${extension[mimeType]}`;
}

export async function uploadPendingMedia(
  media: PendingMedia,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<UploadedMedia> {
  onProgress?.({
    localId: media.localId,
    progress: 0.05,
    status: 'PREPARING',
  });

  const compressedUri = await compressImage(media.uri);

  const file = new File(compressedUri);

  if (!file.exists) {
    throw new Error('The selected image could not be prepared.');
  }

  const sizeBytes = file.size ?? 0;

  if (sizeBytes <= 0) {
    throw new Error('The selected image is empty.');
  }

  if (sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Images must be smaller than 20 MB.');
  }

  const mimeType = resolveMimeType(media);
  const fileName = resolveFileName(media, mimeType);

  onProgress?.({
    localId: media.localId,
    progress: 0.2,
    status: 'REQUESTING_UPLOAD',
  });

  const session = await createMediaUpload({
    fileName,
    mimeType,
    sizeBytes,
    ...(media.width
      ? {
          width: media.width,
        }
      : {}),
    ...(media.height
      ? {
          height: media.height,
        }
      : {}),
  });

  try {
    onProgress?.({
      localId: media.localId,
      mediaId: session.asset.id,
      progress: 0.45,
      status: 'UPLOADING',
    });

    const response = await fetch(session.upload.url, {
      method: session.upload.method,
      headers: session.upload.headers,
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Storage upload failed with status ${response.status}.`);
    }

    onProgress?.({
      localId: media.localId,
      mediaId: session.asset.id,
      progress: 0.85,
      status: 'VERIFYING',
    });

    const asset = await completeMediaUpload(session.asset.id, {
      ...(media.width
        ? {
            width: media.width,
          }
        : {}),
      ...(media.height
        ? {
            height: media.height,
          }
        : {}),
    });

    onProgress?.({
      localId: media.localId,
      mediaId: asset.id,
      progress: 1,
      status: 'READY',
    });

    return {
      localId: media.localId,
      asset,
    };
  } catch (error) {
    await deleteMedia(session.asset.id).catch(() => undefined);

    onProgress?.({
      localId: media.localId,
      mediaId: session.asset.id,
      progress: 0,
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'The image upload failed.',
    });

    throw error;
  }
}

export async function uploadPendingMediaBatch(
  media: PendingMedia[],
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<UploadedMedia[]> {
  const results = await Promise.all(media.map((item) => uploadPendingMedia(item, onProgress)));

  return results;
}

export function getReadyMediaIds(media: UploadedMedia[]): string[] {
  return media.map((item) => item.asset.id);
}

export type { MediaAsset };
