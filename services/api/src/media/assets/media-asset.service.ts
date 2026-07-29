import { Injectable } from '@nestjs/common';

import type { MediaAssetEntity } from './media-asset.entity';

@Injectable()
export class MediaAssetService {
  private assets: MediaAssetEntity[] = [];

  create(asset: MediaAssetEntity): MediaAssetEntity {
    this.assets.push(asset);

    return asset;
  }

  findByOwner(ownerId: string): MediaAssetEntity[] {
    return this.assets.filter((item) => item.ownerId === ownerId);
  }

  remove(id: string): void {
    this.assets = this.assets.filter((item) => item.id !== id);
  }
}
