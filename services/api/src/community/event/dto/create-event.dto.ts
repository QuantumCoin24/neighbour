import {
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LocationVisibility } from '../../../generated/prisma/client.js';

export class CreateEventDto {
  @IsString()
  @Length(3, 120)
  title!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  postcode?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  locationAccuracyM?: number;

  @IsOptional()
  @IsEnum(LocationVisibility)
  locationVisibility?: LocationVisibility;
}
