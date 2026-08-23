import {
  completeMediaUpload,
  createMediaUpload,
  deleteMedia,
  type MediaAsset,
} from '@neighbour/api-client';

export const MAX_MEDIA_ITEMS = 9;
export const MAX_MEDIA_FILE_SIZE = 20 * 1024 * 1024;

const SUPPORTED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export interface WebPendingMedia {
  localId: string;
  file: File;
  previewUrl: string;
}

function resolveMimeType(file: File) {
  const normalized = file.type.toLowerCase();

  if (SUPPORTED.has(normalized)) {
    return normalized as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp'
      | 'image/heic'
      | 'image/heif';
  }

  return null;
}

export function validateWebMediaFile(file: File): string | null {
  if (!resolveMimeType(file)) {
    return 'Only JPEG, PNG, WebP, HEIC and HEIF images are supported.';
  }

  if (file.size <= 0) {
    return 'The selected image is empty.';
  }

  if (file.size > MAX_MEDIA_FILE_SIZE) {
    return 'Images must be smaller than 20 MB.';
  }

  return null;
}

export async function uploadWebMedia(
  pending: WebPendingMedia,
  onProgress?: (value: number) => void,
): Promise<MediaAsset> {
  const mimeType = resolveMimeType(pending.file);

  if (!mimeType) {
    throw new Error('Unsupported image type.');
  }

  onProgress?.(0.1);

  const session = await createMediaUpload({
    fileName: pending.file.name || `neighbour-${pending.localId}`,
    mimeType,
    sizeBytes: pending.file.size,
  });

  try {
    onProgress?.(0.35);

    const response = await fetch(session.upload.url, {
      method: session.upload.method,
      headers: session.upload.headers,
      body: pending.file,
    });

    if (!response.ok) {
      throw new Error(
        `Storage upload failed with status ${response.status}.`,
      );
    }

    onProgress?.(0.82);

    const asset = await completeMediaUpload(session.asset.id);

    onProgress?.(1);

    return asset;
  } catch (error) {
    await deleteMedia(session.asset.id).catch(() => undefined);
    throw error;
  }
}
