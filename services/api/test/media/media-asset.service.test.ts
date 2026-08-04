import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DatabaseService } from '../../src/database/database.service';
import { MediaAssetService } from '../../src/media/assets/media-asset.service';

interface FakeMediaAssetRecord {
  id: string;
  ownerId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

interface FakeDatabase {
  mediaAsset: {
    create(args: {
      data: {
        ownerId: string;
        storageKey: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
      };
    }): Promise<FakeMediaAssetRecord>;
  };
}

describe('MediaAssetService', () => {
  it('creates media assets', async () => {
    const createdAt = new Date('2026-08-04T00:00:00.000Z');

    const database: FakeDatabase = {
      mediaAsset: {
        async create({ data }) {
          return {
            id: 'media-1',
            ownerId: data.ownerId,
            storageKey: data.storageKey,
            fileName: data.fileName,
            mimeType: data.mimeType,
            sizeBytes: data.sizeBytes,
            createdAt,
          };
        },
      },
    };

    const service = new MediaAssetService(database as unknown as DatabaseService);

    const result = await service.create({
      id: 'media-1',
      ownerId: 'user-1',
      ownerType: 'profile',
      fileName: 'avatar.png',
      mimeType: 'image/png',
      size: 1000,
      url: '/media/avatar.png',
      createdAt,
    });

    assert.equal(result.id, 'media-1');
    assert.equal(result.fileName, 'avatar.png');
    assert.equal(result.url, '/media/avatar.png');
    assert.equal(result.size, 1000);
  });
});
