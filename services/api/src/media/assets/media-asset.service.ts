import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { MediaAssetEntity } from './media-asset.entity';

@Injectable()
export class MediaAssetService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(asset: MediaAssetEntity): Promise<MediaAssetEntity> {
    const created = await this.database.mediaAsset.create({
      data: {
        ownerId: asset.ownerId,
        storageKey: asset.url,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        sizeBytes: asset.size,
      },
    });

    return this.map(created);
  }

  async findByOwner(ownerId: string): Promise<MediaAssetEntity[]> {
    const assets = await this.database.mediaAsset.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assets.map((asset) => this.map(asset));
  }

  async findById(id: string): Promise<MediaAssetEntity> {
    const asset = await this.database.mediaAsset.findUnique({
      where: {
        id,
      },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }

    return this.map(asset);
  }

  async remove(id: string): Promise<void> {
    await this.database.mediaAsset.delete({
      where: {
        id,
      },
    });
  }

  private map(asset: {
    id: string;
    ownerId: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
  }): MediaAssetEntity {
    return {
      id: asset.id,
      ownerId: asset.ownerId,
      ownerType: 'profile',
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      size: asset.sizeBytes,
      url: asset.storageKey,
      createdAt: asset.createdAt,
    };
  }
}
