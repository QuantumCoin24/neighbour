import { Inject, Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import type { PushDevice } from '../../generated/prisma/client';
import type { DeviceRegistration } from './device-registration.interface';
import { DevicePlatform } from './device-platform.enum';
import type { RegisterDeviceDto } from './register-device.dto';

@Injectable()
export class DeviceRegistryService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async register(userId: string, input: RegisterDeviceDto): Promise<DeviceRegistration> {
    const now = new Date();

    const device = await this.database.pushDevice.upsert({
      where: {
        token: input.token,
      },
      create: {
        userId,
        platform: input.platform,
        token: input.token,
        ...(input.deviceName
          ? {
              deviceName: input.deviceName,
            }
          : {}),
        registeredAt: now,
        lastSeenAt: now,
      },
      update: {
        userId,
        platform: input.platform,
        ...(input.deviceName
          ? {
              deviceName: input.deviceName,
            }
          : {}),
        registeredAt: now,
        lastSeenAt: now,
        revokedAt: null,
      },
    });

    return this.toRegistration(device);
  }

  async getDevices(userId: string): Promise<DeviceRegistration[]> {
    const devices = await this.database.pushDevice.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: [
        {
          lastSeenAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    return devices.map((device) => this.toRegistration(device));
  }

  async unregister(userId: string, token: string): Promise<boolean> {
    const result = await this.database.pushDevice.updateMany({
      where: {
        userId,
        token,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count > 0;
  }

  async unregisterAll(userId: string): Promise<number> {
    const result = await this.database.pushDevice.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count;
  }

  async touch(userId: string, token: string): Promise<boolean> {
    const result = await this.database.pushDevice.updateMany({
      where: {
        userId,
        token,
        revokedAt: null,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return result.count > 0;
  }

  private toRegistration(device: PushDevice): DeviceRegistration {
    return {
      id: device.id,
      userId: device.userId,
      platform: this.toDevicePlatform(device.platform),
      token: device.token,
      deviceName: device.deviceName,
      registeredAt: device.registeredAt,
      lastSeenAt: device.lastSeenAt,
      revokedAt: device.revokedAt,
    };
  }

  private toDevicePlatform(platform: string): DevicePlatform {
    if (platform === DevicePlatform.IOS) {
      return DevicePlatform.IOS;
    }

    if (platform === DevicePlatform.WEB) {
      return DevicePlatform.WEB;
    }

    throw new Error(`Unsupported push device platform: ${platform}`);
  }
}
