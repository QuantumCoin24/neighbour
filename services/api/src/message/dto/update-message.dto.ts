import { IsString, MaxLength } from 'class-validator';
export class UpdateMessageDto {
  @IsString() @MaxLength(10_000) content!: string;
}
