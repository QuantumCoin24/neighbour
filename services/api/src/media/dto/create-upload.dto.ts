import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const supportedMediaMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
] as const;

/**
 * Backwards-compatible export retained for existing tests and
 * image-only callers. The authoritative upload MIME contract is
 * supportedMediaMimeTypes.
 */
export const supportedImageMimeTypes = supportedMediaMimeTypes;

export class CreateUploadDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsIn(supportedMediaMimeTypes)
  mimeType!: (typeof supportedMediaMimeTypes)[number];

  @IsInt()
  @Min(1)
  @Max(200 * 1024 * 1024)
  sizeBytes!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10 * 60 * 1000)
  durationMs?: number;
}
