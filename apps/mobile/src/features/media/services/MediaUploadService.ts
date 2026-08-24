import {
  completeMediaUpload,
  createMediaUpload,
  deleteMedia,
  type MediaAsset,
} from '@neighbour/api-client';
import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';

import { compressImage } from './ImageCompression';
import type {
  MediaUploadProgress,
  PendingMedia,
  SupportedMediaMimeType,
  UploadedMedia,
} from '../types';

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

const SUPPORTED_MIME_TYPES = new Set<SupportedMediaMimeType>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
]);

function resolveMimeType(media: PendingMedia): SupportedMediaMimeType {
  if (SUPPORTED_MIME_TYPES.has(media.mimeType)) {
    return media.mimeType;
  }

  return 'image/jpeg';
}

function extensionForMime(mimeType: SupportedMediaMimeType): string {
  switch (mimeType) {
    case 'video/mp4':
      return 'mp4';

    case 'video/quicktime':
      return 'mov';

    case 'image/png':
      return 'png';

    case 'image/webp':
      return 'webp';

    case 'image/heic':
      return 'heic';

    case 'image/heif':
      return 'heif';

    default:
      return 'jpg';
  }
}

function resolveFileName(media: PendingMedia, mimeType: SupportedMediaMimeType): string {
  if (media.fileName.trim()) {
    return media.fileName.trim();
  }

  return `neighbour-${media.localId}.${extensionForMime(mimeType)}`;
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

  const video = media.mimeType.startsWith('video/');

  const preparedUri = video ? media.uri : await compressImage(media.uri);

  const file = new File(preparedUri);

  if (!file.exists) {
    throw new Error(
      video
        ? 'The selected video could not be prepared.'
        : 'The selected image could not be prepared.',
    );
  }

  const sizeBytes = file.size ?? 0;

  if (sizeBytes <= 0) {
    throw new Error('The selected media file is empty.');
  }

  const maxSize = video ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  if (sizeBytes > maxSize) {
    throw new Error(
      video ? 'Videos must be smaller than 200 MB.' : 'Images must be smaller than 20 MB.',
    );
  }

  const mimeType: SupportedMediaMimeType = video ? resolveMimeType(media) : 'image/jpeg';

  const fileName = video ? resolveFileName(media, mimeType) : `neighbour-${media.localId}.jpg`;

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
    ...(media.durationMs !== undefined
      ? {
          durationMs: media.durationMs,
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
      ...(media.durationMs !== undefined
        ? {
            durationMs: media.durationMs,
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
      error: error instanceof Error ? error.message : 'The media upload failed.',
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
