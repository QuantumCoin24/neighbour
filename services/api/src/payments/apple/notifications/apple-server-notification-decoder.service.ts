import { BadRequestException, Injectable } from '@nestjs/common';

import type {
  AppleNotificationType,
  AppleServerNotificationPayload,
  RawAppleNotificationData,
  RawAppleServerNotification,
} from './apple-server-notification.interface';

const SUPPORTED_NOTIFICATION_TYPES = new Set<AppleNotificationType>([
  'CONSUMPTION_REQUEST',
  'DID_CHANGE_RENEWAL_PREF',
  'DID_CHANGE_RENEWAL_STATUS',
  'DID_FAIL_TO_RENEW',
  'DID_RENEW',
  'EXPIRED',
  'EXTERNAL_PURCHASE_TOKEN',
  'GRACE_PERIOD_EXPIRED',
  'OFFER_REDEEMED',
  'ONE_TIME_CHARGE',
  'PRICE_INCREASE',
  'REFUND',
  'REFUND_DECLINED',
  'REFUND_REVERSED',
  'RENEWAL_EXTENDED',
  'RENEWAL_EXTENSION',
  'REVOKE',
  'SUBSCRIBED',
  'TEST',
]);

@Injectable()
export class AppleServerNotificationDecoderService {
  decode(signedPayload: string): AppleServerNotificationPayload {
    const parts = signedPayload.split('.');

    if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
      throw new BadRequestException('Apple server notification must use compact JWS format.');
    }

    const encodedPayload = parts[1];

    if (!encodedPayload) {
      throw new BadRequestException('Apple server notification payload is missing.');
    }

    let raw: RawAppleServerNotification;

    try {
      raw = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as RawAppleServerNotification;
    } catch {
      throw new BadRequestException('Apple server notification payload is not valid JSON.');
    }

    const notificationType = this.requireNotificationType(raw.notificationType);

    const notificationUUID = this.requireString(raw.notificationUUID, 'notificationUUID');

    const version = this.requireString(raw.version, 'version');

    const signedDate = this.requireDate(raw.signedDate, 'signedDate');

    if (!raw.data || typeof raw.data !== 'object') {
      throw new BadRequestException('Apple server notification data is missing.');
    }

    const data = raw.data as RawAppleNotificationData;

    const bundleId = this.requireString(data.bundleId, 'bundleId');

    const environment = this.requireEnvironment(data.environment);

    return {
      notificationType,
      subtype:
        typeof raw.subtype === 'string' && raw.subtype.trim().length > 0 ? raw.subtype : null,
      notificationUUID,
      version,
      signedDate,
      data: {
        appAppleId: typeof data.appAppleId === 'number' ? data.appAppleId : null,
        bundleId,
        bundleVersion: typeof data.bundleVersion === 'string' ? data.bundleVersion : null,
        environment,
        signedTransactionInfo:
          typeof data.signedTransactionInfo === 'string' ? data.signedTransactionInfo : null,
        signedRenewalInfo:
          typeof data.signedRenewalInfo === 'string' ? data.signedRenewalInfo : null,
        status: typeof data.status === 'number' ? data.status : null,
      },
    };
  }

  private requireNotificationType(value: unknown): AppleNotificationType {
    if (
      typeof value !== 'string' ||
      !SUPPORTED_NOTIFICATION_TYPES.has(value as AppleNotificationType)
    ) {
      throw new BadRequestException('Apple notificationType is unsupported.');
    }

    return value as AppleNotificationType;
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`Apple notification ${field} is invalid.`);
    }

    return value;
  }

  private requireDate(value: unknown, field: string): Date {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new BadRequestException(`Apple notification ${field} is invalid.`);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Apple notification ${field} is invalid.`);
    }

    return date;
  }

  private requireEnvironment(value: unknown): 'Sandbox' | 'Production' {
    if (value !== 'Sandbox' && value !== 'Production') {
      throw new BadRequestException('Apple notification environment is invalid.');
    }

    return value;
  }
}
