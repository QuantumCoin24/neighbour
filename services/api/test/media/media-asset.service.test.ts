import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MediaAssetService } from '../../src/media/assets/media-asset.service';

describe('MediaAssetService', () => {
  it('creates media assets', () => {
    const service = new MediaAssetService();

    const result = service.create({
      id: 'media-1',
      ownerId: 'user-1',
      ownerType: 'profile',
      fileName: 'avatar.png',
      mimeType: 'image/png',
      size: 1000,
      url: '/media/avatar.png',
      createdAt: new Date(),
    });

    assert.equal(result.fileName, 'avatar.png');
  });
});
