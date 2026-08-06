import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDeliveryDto {
  @IsString()
  @MaxLength(255)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsString()
  @MaxLength(120)
  city!: string;

  @IsString()
  @MaxLength(16)
  postcode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  courier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  instructions?: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
