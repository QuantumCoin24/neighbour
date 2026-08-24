import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class VibeFeedQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsUUID()
  neighbourhoodId?: string;
}
