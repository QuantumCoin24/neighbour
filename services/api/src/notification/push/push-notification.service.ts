import { Injectable } from '@nestjs/common';

import { DeviceRegistryService } from '../device/device-registry.service';
import { DevicePlatform } from '../device/device-platform.enum';
import { ApnsClientService } from './apns-client.service';
import type { ApnsPayload, ApnsSendResult } from './apns-payload.interface';

export interface PushNotificationRequest {
  userId: string;
  payload: ApnsPayload;
  collapseId?: string;
}

export interface PushNotificationDelivery {
  deviceId: string;
  platform: DevicePlatform;
  result: ApnsSendResult;
}

@Injectable()
export class PushNotificationService {
  constructor(
    private readonly devices: DeviceRegistryService,
    private readonly apns: ApnsClientService,
  ) {}

  async sendToUser(request: PushNotificationRequest): Promise<PushNotificationDelivery[]> {
    const devices = await this.devices.getDevices(request.userId);

    const iosDevices = devices.filter((device) => device.platform === DevicePlatform.IOS);

    return Promise.all(
      iosDevices.map(async (device) => ({
        deviceId: device.id,
        platform: device.platform,
        result: await this.apns.send({
          deviceToken: device.token,
          payload: request.payload,
          ...(request.collapseId
            ? {
                collapseId: request.collapseId,
              }
            : {}),
        }),
      })),
    );
  }
}
