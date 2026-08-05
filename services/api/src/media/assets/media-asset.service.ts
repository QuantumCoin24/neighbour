import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { DatabaseService } from '../../database/database.service';
import type { CompleteUploadDto } from '../dto/complete-upload.dto';
import type { CreateUploadDto } from '../dto/create-upload.dto';
import type {
  MediaAssetResponse,
  MediaUploadResponse,
  PostMediaResponse,
} from '../interfaces/media-response.interface';
import { ObjectStorageService } from '../storage/object-storage.service';

@Injectable()
export class MediaAssetService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
    private readonly storage: ObjectStorageService,
  ) {}

  async createUpload(ownerId: string, dto: CreateUploadDto): Promise<MediaUploadResponse> {
    const extension = this.resolveExtension(dto.mimeType);

    const assetId = randomUUID();
    const storageKey = `users/${ownerId}/media/${assetId}.${extension}`;

    const created = await this.database.mediaAsset.create({
      data: {
        id: assetId,
        ownerId,
        storageKey,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        width: dto.width ?? null,
        height: dto.height ?? null,
        status: 'PENDING',
      },
    });

    const uploadUrl = await this.storage.createUploadUrl({
      storageKey,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    });

    return {
      asset: this.map(created),
      upload: {
        method: 'PUT',
        url: uploadUrl,
        headers: {
          'Content-Type': dto.mimeType,
        },
        expiresInSeconds: 15 * 60,
      },
    };
  }

  async completeUpload(
    ownerId: string,
    assetId: string,
    dto: CompleteUploadDto,
  ): Promise<MediaAssetResponse> {
    const asset = await this.requireOwnedAsset(ownerId, assetId);

    if (asset.status === 'READY') {
      return this.map(asset);
    }

    const object = await this.storage.verifyObject(asset.storageKey);

    if (object.sizeBytes !== asset.sizeBytes) {
      await this.database.mediaAsset.update({
        where: {
          id: asset.id,
        },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
        },
      });

      throw new BadRequestException('Uploaded file size does not match the upload request.');
    }

    if (object.mimeType && object.mimeType !== asset.mimeType) {
      throw new BadRequestException('Uploaded file type does not match the upload request.');
    }

    const completed = await this.database.mediaAsset.update({
      where: {
        id: asset.id,
      },
      data: {
        ...(dto.checksum !== undefined
          ? {
              checksum: dto.checksum,
            }
          : {}),

        width: dto.width ?? asset.width,
        height: dto.height ?? asset.height,
        publicUrl: this.storage.resolvePublicUrl(asset.storageKey),
        status: 'READY',
        uploadedAt: new Date(),
        readyAt: new Date(),
        failedAt: null,
      },
    });

    return this.map(completed);
  }

  async attachToPost(
    currentUserId: string,
    postId: string,
    mediaIds: string[],
  ): Promise<PostMediaResponse[]> {
    const post = await this.database.post.findFirst({
      where: {
        id: postId,
        authorId: currentUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const uniqueIds = [...new Set(mediaIds)];

    if (uniqueIds.length !== mediaIds.length) {
      throw new BadRequestException('Duplicate media assets are not allowed.');
    }

    const assets = await this.database.mediaAsset.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
        ownerId: currentUserId,
        status: 'READY',
        deletedAt: null,
      },
    });

    if (assets.length !== uniqueIds.length) {
      throw new ForbiddenException('One or more media assets are unavailable.');
    }

    await this.database.$transaction([
      this.database.postMedia.deleteMany({
        where: {
          postId,
        },
      }),
      ...uniqueIds.map((mediaId, position) =>
        this.database.postMedia.create({
          data: {
            postId,
            mediaId,
            position,
          },
        }),
      ),
    ]);

    return this.getPostMedia(postId);
  }

  async getPostMedia(postId: string): Promise<PostMediaResponse[]> {
    const links = await this.database.postMedia.findMany({
      where: {
        postId,
        media: {
          status: 'READY',
          deletedAt: null,
        },
      },
      include: {
        media: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return links.map((link) => ({
      id: link.id,
      position: link.position,
      altText: link.altText,
      asset: this.map(link.media),
    }));
  }

  async findMine(ownerId: string): Promise<MediaAssetResponse[]> {
    const assets = await this.database.mediaAsset.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assets.map((asset) => this.map(asset));
  }

  async remove(ownerId: string, assetId: string): Promise<void> {
    const asset = await this.requireOwnedAsset(ownerId, assetId);

    await this.storage.remove(asset.storageKey);

    await this.database.mediaAsset.update({
      where: {
        id: asset.id,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }

  private async requireOwnedAsset(ownerId: string, assetId: string) {
    const asset = await this.database.mediaAsset.findFirst({
      where: {
        id: assetId,
        ownerId,
        deletedAt: null,
      },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }

    return asset;
  }

  private resolveExtension(mimeType: string): string {
    const values: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };

    const extension = values[mimeType];

    if (!extension) {
      throw new BadRequestException('Unsupported media type.');
    }

    return extension;
  }

  private map(asset: {
    id: string;
    ownerId: string;
    storageKey: string;
    publicUrl: string | null;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    durationMs: number | null;
    status: 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED' | 'DELETED';
    uploadedAt: Date | null;
    readyAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): MediaAssetResponse {
    return {
      id: asset.id,
      ownerId: asset.ownerId,
      storageKey: asset.storageKey,
      url: asset.publicUrl,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      durationMs: asset.durationMs,
      status: asset.status,
      uploadedAt: asset.uploadedAt,
      readyAt: asset.readyAt,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }
}
