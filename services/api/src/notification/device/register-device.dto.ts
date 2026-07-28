import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { DevicePlatform } from './device-platform.enum';

export class RegisterDeviceDto {
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsString()
  @MaxLength(4096)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceName?: string;
}
