#!/bin/bash

set -e

echo "🚀 BUILD 0037 — Media Storage Engine"

cd services/api

mkdir -p src/media/assets
mkdir -p src/media/storage
mkdir -p src/media/processing
mkdir -p src/media/events


# =====================================
# MEDIA ASSET
# =====================================

cat > src/media/assets/media-asset.entity.ts <<'TS'
export interface MediaAssetEntity {
  id: string;
  ownerId: string;
  ownerType:
    | 'profile'
    | 'community'
    | 'event'
    | 'business'
    | 'post';
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}
TS


cat > src/media/assets/media-asset.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { MediaAssetEntity } from './media-asset.entity';


@Injectable()
export class MediaAssetService {

  private assets:
    MediaAssetEntity[] = [];


  create(
    asset: MediaAssetEntity,
  ): MediaAssetEntity {

    this.assets.push(asset);

    return asset;
  }


  findByOwner(
    ownerId: string,
  ): MediaAssetEntity[] {

    return this.assets.filter(
      (item) =>
        item.ownerId === ownerId,
    );
  }


  remove(
    id: string,
  ): void {

    this.assets =
      this.assets.filter(
        (item) =>
          item.id !== id,
      );

  }

}
TS


# =====================================
# STORAGE
# =====================================

cat > src/media/storage/storage.entity.ts <<'TS'
export interface StorageEntity {
  id: string;
  assetId: string;
  provider: string;
  path: string;
  createdAt: Date;
}
TS


cat > src/media/storage/storage.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { StorageEntity } from './storage.entity';


@Injectable()
export class StorageService {

  private storage:
    StorageEntity[] = [];


  save(
    item: StorageEntity,
  ): StorageEntity {

    this.storage.push(item);

    return item;
  }


  find(
    assetId: string,
  ): StorageEntity | undefined {

    return this.storage.find(
      (item) =>
        item.assetId === assetId,
    );
  }

}
TS


# =====================================
# MEDIA PROCESSING
# =====================================

cat > src/media/processing/media-processing.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class MediaProcessingService {

  process(
    assetId: string,
  ) {

    return {
      assetId,
      status: 'processed',
      processedAt: new Date(),
    };

  }

}
TS


# =====================================
# MEDIA EVENTS
# =====================================

cat > src/media/events/media-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type MediaEvent =
  | {
      type: 'media.uploaded';
      assetId: string;
    }
  | {
      type: 'media.processed';
      assetId: string;
    }
  | {
      type: 'media.deleted';
      assetId: string;
    };


@Injectable()
export class MediaEventBusService {

  private listeners:
    ((event: MediaEvent) => void)[] = [];


  subscribe(
    listener: (event: MediaEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: MediaEvent,
  ) {

    for (const listener of this.listeners) {
      listener(event);
    }

  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/media

cat > test/media/media-asset.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MediaAssetService } from '../../src/media/assets/media-asset.service';


describe('MediaAssetService', () => {

  it('creates media assets', () => {

    const service =
      new MediaAssetService();


    const result =
      service.create({
        id: 'media-1',
        ownerId: 'user-1',
        ownerType: 'profile',
        fileName: 'avatar.png',
        mimeType: 'image/png',
        size: 1000,
        url: '/media/avatar.png',
        createdAt: new Date(),
      });


    assert.equal(
      result.fileName,
      'avatar.png',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0037 COMPLETE"

