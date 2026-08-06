import { useCallback, useMemo, useState } from 'react';

import { uploadPendingMediaBatch } from '../services/MediaUploadService';
import type { MediaUploadProgress, PendingMedia, UploadedMedia } from '../types';

export function useMediaUpload() {
  const [progress, setProgress] = useState<Record<string, MediaUploadProgress>>({});

  const [uploaded, setUploaded] = useState<UploadedMedia[]>([]);

  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (media: PendingMedia[]): Promise<UploadedMedia[]> => {
    if (media.length === 0) {
      return [];
    }

    setUploading(true);

    setProgress(
      Object.fromEntries(
        media.map((item) => [
          item.localId,
          {
            localId: item.localId,
            progress: 0,
            status: 'SELECTED',
          },
        ]),
      ),
    );

    try {
      const result = await uploadPendingMediaBatch(media, (nextProgress) => {
        setProgress((current) => ({
          ...current,
          [nextProgress.localId]: nextProgress,
        }));
      });

      setUploaded(result);

      return result;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({});
    setUploaded([]);
    setUploading(false);
  }, []);

  const overallProgress = useMemo(() => {
    const values = Object.values(progress);

    if (values.length === 0) {
      return 0;
    }

    return values.reduce((total, item) => total + item.progress, 0) / values.length;
  }, [progress]);

  return {
    overallProgress,
    progress,
    reset,
    upload,
    uploaded,
    uploading,
  };
}
