import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ConversationType } from '../../generated/prisma/client';

export class CreateConversationDto {
  @IsEnum(ConversationType) type!: ConversationType;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(250)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  memberIds!: string[];
  @IsOptional() @IsUUID('4') communityId?: string;
}
