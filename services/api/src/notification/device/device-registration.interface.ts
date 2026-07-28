import { DevicePlatform } from './device-platform.enum';

export interface DeviceRegistration {
  id: string;
  userId: string;
  platform: DevicePlatform;
  token: string;
  deviceName: string | null;
  registeredAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
}
