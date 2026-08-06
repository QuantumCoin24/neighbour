import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { MarketplaceProofType } from '../../../generated/prisma/client';

export class UploadProofDto {
  @IsUUID('4')
  mediaId!: string;

  @IsEnum(MarketplaceProofType)
  type!: MarketplaceProofType;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  note?: string;
}
