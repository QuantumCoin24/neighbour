import { IsString, MinLength } from 'class-validator';

export class VerifyQrDto {
  @IsString()
  @MinLength(32)
  token!: string;
}
