import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | null;

  constructor() {
    const endpoint = process.env.MEDIA_S3_ENDPOINT?.trim();
    const region = process.env.MEDIA_S3_REGION?.trim() ?? 'auto';
    const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY?.trim();
    const bucket = process.env.MEDIA_S3_BUCKET?.trim();

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new InternalServerErrorException('Media object storage is not configured.');
    }

    this.bucket = bucket;
    this.publicBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') || null;

    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE !== 'false',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async createUploadUrl(input: {
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.storageKey,
        ContentType: input.mimeType,
        ContentLength: input.sizeBytes,
      }),
      {
        expiresIn: 15 * 60,
      },
    );
  }

  async verifyObject(storageKey: string): Promise<{
    sizeBytes: number;
    mimeType: string | null;
  }> {
    const result = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );

    return {
      sizeBytes: result.ContentLength ?? 0,
      mimeType: result.ContentType ?? null,
    };
  }

  async remove(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }

  resolvePublicUrl(storageKey: string): string | null {
    return this.publicBaseUrl ? `${this.publicBaseUrl}/${storageKey}` : null;
  }
}
