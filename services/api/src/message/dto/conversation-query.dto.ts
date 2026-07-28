import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
export class ConversationQueryDto {
  @IsOptional() @IsUUID('4') cursor?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit = 30;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  archived = false;
}
