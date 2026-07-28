import { DevicePlatform } from './device-platform.enum';

export interface DeviceRegistration {
  userId: string;
  platform: DevicePlatform;
  token: string;
  deviceName?: string;
  registeredAt: Date;
  lastSeenAt: Date;
}
