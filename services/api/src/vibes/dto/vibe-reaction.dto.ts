import { IsEnum } from 'class-validator';

import { VibeReactionType } from '../../generated/prisma/client';

export class VibeReactionDto {
  @IsEnum(VibeReactionType)
  type!: VibeReactionType;
}
