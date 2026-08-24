import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export const vibeFeedModes = ['FOR_YOU', 'FOLLOWING', 'NEARBY'] as const;

export type VibeFeedMode = (typeof vibeFeedModes)[number];

export class VibeFeedQueryDto {
  @IsOptional()
  @IsIn(vibeFeedModes)
  mode: VibeFeedMode = 'FOR_YOU';

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
