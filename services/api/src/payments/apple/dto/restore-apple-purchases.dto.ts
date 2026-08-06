import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class RestoreApplePurchasesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({
    each: true,
  })
  @IsNotEmpty({
    each: true,
  })
  @MaxLength(32_000, {
    each: true,
  })
  signedTransactions!: string[];
}
