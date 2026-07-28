import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
export class UpdateConversationStateDto {
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsDateString() mutedUntil?: string;
}
