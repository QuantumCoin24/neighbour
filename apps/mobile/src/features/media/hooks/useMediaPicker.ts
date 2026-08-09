import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import type { MediaSelectionResult, PendingMedia, SupportedImageMimeType } from '../types';

const MAX_SELECTION = 9;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function normalizeMimeType(asset: ImagePicker.ImagePickerAsset): SupportedImageMimeType {
  const mimeType = asset.mimeType?.toLowerCase();

  switch (mimeType) {
    case 'image/png':
    case 'image/webp':
    case 'image/heic':
    case 'image/heif':
    case 'image/jpeg':
      return mimeType;

    default:
      return 'image/jpeg';
  }
}

function mapAssets(assets: ImagePicker.ImagePickerAsset[]): MediaSelectionResult {
  const items: PendingMedia[] = [];
  let rejectedCount = 0;

  for (const asset of assets.slice(0, MAX_SELECTION)) {
    const sizeBytes = asset.fileSize ?? 0;

    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      rejectedCount += 1;
      continue;
    }

    items.push({
      localId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      uri: asset.uri,
      fileName: asset.fileName ?? `neighbour-${Date.now()}.jpg`,
      mimeType: normalizeMimeType(asset),
      sizeBytes,
      width: asset.width,
      height: asset.height,
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

  const pickFromLibrary = useCallback(async (): Promise<MediaSelectionResult> => {
    setOpening(true);
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Photo-library permission is required to choose images.');

        return {
          items: [],
          rejectedCount: 0,
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_SELECTION,
        quality: 1,
        orderedSelection: true,
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

  return {
    error,
    opening,
    pickFromLibrary,
    takePhoto,
  };
}
