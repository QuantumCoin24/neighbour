import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AppleServerNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  signedPayload!: string;
}
