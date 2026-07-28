import { IsEnum } from 'class-validator';

import { ReactionType } from '../../generated/prisma/client';

export class SetReactionDto {
  @IsEnum(ReactionType)
  type!: ReactionType;
}
