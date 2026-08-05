import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const supportedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export class CreateUploadDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsIn(supportedImageMimeTypes)
  mimeType!: (typeof supportedImageMimeTypes)[number];

  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
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
}
