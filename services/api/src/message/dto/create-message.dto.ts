import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MessageType } from '../../generated/prisma/client';

export class CreateMessageAttachmentDto {
  @IsString() @MaxLength(512) storageKey!: string;
  @IsString() @MaxLength(255) fileName!: string;
  @IsString() @MaxLength(127) mimeType!: string;
  @IsInt() @Min(1) @Max(2_147_483_647) sizeBytes!: number;
  @IsOptional() @IsInt() @Min(1) width?: number;
  @IsOptional() @IsInt() @Min(1) height?: number;
  @IsOptional() @IsInt() @Min(0) durationMs?: number;
}

export class CreateMessageDto {
  @IsOptional() @IsEnum(MessageType) type: MessageType = MessageType.TEXT;
  @IsOptional() @IsString() @MaxLength(10_000) content?: string;
  @IsOptional() @IsUUID('4') parentMessageId?: string;
  @IsOptional() @IsString() @MaxLength(128) clientNonce?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateMessageAttachmentDto)
  attachments?: CreateMessageAttachmentDto[];
}
