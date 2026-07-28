import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
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
  avatarUrl?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  localArea?: string;

  @IsOptional()
  @IsBoolean()
  showLocalArea?: boolean;
}
