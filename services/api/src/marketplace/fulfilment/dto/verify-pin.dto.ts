import { IsString, Length } from 'class-validator';

export class VerifyPinDto {
  @IsString()
  @Length(6, 6)
  pin!: string;
}
