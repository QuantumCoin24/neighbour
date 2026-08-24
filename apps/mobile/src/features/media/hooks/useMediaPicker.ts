import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import type { MediaSelectionResult, PendingMedia, SupportedMediaMimeType } from '../types';

const MAX_SELECTION = 9;
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 60;

function normalizeMimeType(asset: ImagePicker.ImagePickerAsset): SupportedMediaMimeType {
  const mimeType = asset.mimeType?.toLowerCase();

  switch (mimeType) {
    case 'image/png':
    case 'image/webp':
    case 'image/heic':
    case 'image/heif':
    case 'image/jpeg':
    case 'video/mp4':
    case 'video/quicktime':
      return mimeType;

    default:
      return asset.type === 'video' ? 'video/quicktime' : 'image/jpeg';
  }
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

function mapAssets(assets: ImagePicker.ImagePickerAsset[]): MediaSelectionResult {
  const items: PendingMedia[] = [];
  let rejectedCount = 0;

  for (const asset of assets.slice(0, MAX_SELECTION)) {
    const mimeType = normalizeMimeType(asset);
    const video = mimeType.startsWith('video/');
    const sizeBytes = asset.fileSize ?? 0;
    const maxSize = video ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

    if (sizeBytes > maxSize) {
      rejectedCount += 1;
      continue;
    }

    const durationMs = video && typeof asset.duration === 'number' ? asset.duration : undefined;

    items.push({
      localId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      uri: asset.uri,
      fileName: asset.fileName ?? `neighbour-${Date.now()}.${extensionForMime(mimeType)}`,
      mimeType,
      sizeBytes,
      width: asset.width,
      height: asset.height,
      ...(durationMs !== undefined
        ? {
            durationMs,
          }
        : {}),
    });
  }

  return {
    items,
    rejectedCount,
  };
}

export function useMediaPicker() {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFromLibrary = useCallback(
    async (allowVideos = false): Promise<MediaSelectionResult> => {
      setOpening(true);
      setError(null);

      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setError('Photo-library permission is required to choose media.');

          return {
            items: [],
            rejectedCount: 0,
          };
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: allowVideos ? ['images', 'videos'] : ['images'],
          allowsMultipleSelection: true,
          selectionLimit: MAX_SELECTION,
          quality: 1,
          orderedSelection: true,
          videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
        });

        if (result.canceled) {
          return {
            items: [],
            rejectedCount: 0,
          };
        }

        return mapAssets(result.assets);
      } finally {
        setOpening(false);
      }
    },
    [],
  );

  const takePhoto = useCallback(async (): Promise<MediaSelectionResult> => {
    setOpening(true);
    setError(null);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setError('Camera permission is required to take a photo.');

        return {
          items: [],
          rejectedCount: 0,
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        return {
          items: [],
          rejectedCount: 0,
        };
      }

      return mapAssets(result.assets);
    } finally {
      setOpening(false);
    }
  }, []);

  const takeVideo = useCallback(async (): Promise<MediaSelectionResult> => {
    setOpening(true);
    setError(null);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setError('Camera permission is required to record video.');

        return {
          items: [],
          rejectedCount: 0,
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
      });

      if (result.canceled) {
        return {
          items: [],
          rejectedCount: 0,
        };
      }

      return mapAssets(result.assets);
    } finally {
      setOpening(false);
    }
  }, []);

  return {
    error,
    opening,
    pickFromLibrary,
    takePhoto,
    takeVideo,
  };
}
