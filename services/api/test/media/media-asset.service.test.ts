import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DatabaseService } from '../../src/database/database.service';
import { MediaAssetService } from '../../src/media/assets/media-asset.service';
import type { ObjectStorageService } from '../../src/media/storage/object-storage.service';
import type { SubscriptionService } from '../../src/payments/subscription/subscription.service';

describe('MediaAssetService', () => {
  it('creates a signed image upload session', async () => {
    const timestamp = new Date('2026-08-06T00:00:00.000Z');

    const database = {
      mediaAsset: {
        aggregate: async () => ({
          _sum: {
            sizeBytes: 0,
          },
        }),
        create: async ({
          data,
        }: {
          data: {
            id: string;
            ownerId: string;
            storageKey: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            width: number | null;
            height: number | null;
            status: 'PENDING';
          };
        }) => ({
          ...data,
          publicUrl: null,
          durationMs: null,
          checksum: null,
          uploadedAt: null,
          readyAt: null,
          failedAt: null,
          deletedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
      },
    };

    const storage = {
      createUploadUrl: async () => 'https://storage.example.test/upload',
      resolvePublicUrl: () => null,
    };

    const subscriptions = {
      getStorageLimitBytes: async () => 100 * 1024 * 1024,
    };

    const service = new MediaAssetService(
      database as unknown as DatabaseService,
      storage as unknown as ObjectStorageService,
      subscriptions as unknown as SubscriptionService,
    );

    const result = await service.createUpload('11111111-1111-4111-8111-111111111111', {
      fileName: 'community-photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1_500_000,
      width: 1600,
      height: 1200,
    });

    assert.equal(result.asset.ownerId, '11111111-1111-4111-8111-111111111111');

    assert.equal(result.asset.fileName, 'community-photo.jpg');

    assert.equal(result.asset.mimeType, 'image/jpeg');

    assert.equal(result.asset.status, 'PENDING');

    assert.equal(result.upload.method, 'PUT');

    assert.equal(result.upload.url, 'https://storage.example.test/upload');

    assert.equal(result.upload.headers['Content-Type'], 'image/jpeg');
  });
});
