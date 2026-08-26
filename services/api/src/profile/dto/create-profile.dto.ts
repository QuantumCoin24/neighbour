import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

import { normaliseUsername } from '../utils/profile-username.util';

export class CreateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? normaliseUsername(value) : value))
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/, {
    message: 'username may contain letters, numbers, full stops and underscores',
  })
  username!: string;

  @IsOptional()
  @IsString()
  localArea?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
