import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLiveSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsUUID()
  neighbourhoodId?: string;
}
