import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { CommunityVisibility } from '../../generated/prisma/client.js';

export class CreateCommunityDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 100)
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(CommunityVisibility)
  visibility: CommunityVisibility = CommunityVisibility.PUBLIC;
}
