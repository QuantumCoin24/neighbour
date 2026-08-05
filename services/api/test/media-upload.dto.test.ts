import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateUploadDto, supportedImageMimeTypes } from '../src/media/dto/create-upload.dto';

describe('MediaOS upload contract', () => {
  it('supports production image formats', () => {
    assert.deepEqual(supportedImageMimeTypes, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ]);
  });

  it('accepts a valid image upload', async () => {
    const dto = plainToInstance(CreateUploadDto, {
      fileName: 'community-photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1_500_000,
      width: 1600,
      height: 1200,
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(instanceToPlain(dto).fileName, 'community-photo.jpg');
  });

  it('rejects unsupported file formats', async () => {
    const dto = plainToInstance(CreateUploadDto, {
      fileName: 'unsafe.exe',
      mimeType: 'application/octet-stream',
      sizeBytes: 100,
    });

    const errors = await validate(dto);

    assert.ok(errors.length > 0);
  });

  it('rejects files above twenty megabytes', async () => {
    const dto = plainToInstance(CreateUploadDto, {
      fileName: 'oversized.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 21 * 1024 * 1024,
    });

    const errors = await validate(dto);

    assert.ok(errors.length > 0);
  });
});
