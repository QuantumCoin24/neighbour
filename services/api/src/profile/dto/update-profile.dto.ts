import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

import { normaliseUsername } from '../utils/profile-username.util';

export class UpdateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? normaliseUsername(value) : value))
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/, {
    message: 'username may contain lowercase letters, numbers, full stops and underscores',
  })
  username?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: 'avatarUrl must be a valid HTTP or HTTPS URL',
    },
  )
  @MaxLength(2048)
  avatarUrl?: string | null;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  localArea?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  showLocalArea?: boolean;
}
