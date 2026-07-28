import { Injectable } from '@nestjs/common';

import { DeviceRegistration } from './device-registration.interface';

@Injectable()
export class DeviceRegistryService {
  private readonly devices = new Map<string, DeviceRegistration[]>();

  register(device: DeviceRegistration): void {
    const existing = this.devices.get(device.userId) ?? [];

    const filtered = existing.filter((entry) => entry.token !== device.token);

    filtered.push(device);

    this.devices.set(device.userId, filtered);
  }

  getDevices(userId: string): DeviceRegistration[] {
    return this.devices.get(userId) ?? [];
  }

  unregister(userId: string, token: string): void {
    const existing = this.devices.get(userId) ?? [];

    this.devices.set(
      userId,
      existing.filter((entry) => entry.token !== token),
    );
  }

  clear(): void {
    this.devices.clear();
  }
}
