import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyAppleTransactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32_000)
  signedTransactionInfo!: string;
}
