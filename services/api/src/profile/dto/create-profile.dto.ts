import { IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  localArea?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
