import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { SubscriptionService } from '../../subscription/subscription.service';
import { AppleProductService } from '../services/apple-product.service';
import { AppleTransactionDecoderService } from '../services/apple-transaction-decoder.service';
import { AppleServerNotificationDecoderService } from './apple-server-notification-decoder.service';
import type {
  AppleNotificationType,
  AppleServerNotificationPayload,
} from './apple-server-notification.interface';

export type AppleNotificationAction =
  | 'SUBSCRIPTION_SYNCED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_NOT_FOUND'
  | 'NO_ACTION';

export interface AppleNotificationResult {
  accepted: true;
  notificationUUID: string;
  notificationType: AppleNotificationType;
  subtype: string | null;
  action: AppleNotificationAction;
}

@Injectable()
export class AppleServerNotificationService {
  private readonly logger = new Logger(AppleServerNotificationService.name);

  constructor(
    private readonly notifications: AppleServerNotificationDecoderService,
    private readonly transactions: AppleTransactionDecoderService,
    private readonly products: AppleProductService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  async process(signedPayload: string): Promise<AppleNotificationResult> {
    const notification = this.notifications.decode(signedPayload);

    this.validateApplication(notification);

    const action = await this.apply(notification);

    this.logger.log(
      JSON.stringify({
        event: 'apple.server-notification.processed',
        notificationUUID: notification.notificationUUID,
        notificationType: notification.notificationType,
        subtype: notification.subtype,
        environment: notification.data.environment,
        action,
      }),
    );

    return {
      accepted: true,
      notificationUUID: notification.notificationUUID,
      notificationType: notification.notificationType,
      subtype: notification.subtype,
      action,
    };
  }

  private async apply(
    notification: AppleServerNotificationPayload,
  ): Promise<AppleNotificationAction> {
    switch (notification.notificationType) {
      case 'SUBSCRIBED':
      case 'DID_RENEW':
      case 'OFFER_REDEEMED':
      case 'RENEWAL_EXTENDED':
      case 'REFUND_REVERSED':
        return this.syncTransaction(notification);

      case 'DID_FAIL_TO_RENEW':
      case 'DID_CHANGE_RENEWAL_STATUS':
      case 'DID_CHANGE_RENEWAL_PREF':
      case 'PRICE_INCREASE':
        return notification.data.signedTransactionInfo
          ? this.syncTransaction(notification)
          : 'NO_ACTION';

      case 'EXPIRED':
      case 'GRACE_PERIOD_EXPIRED':
        return this.expireTransaction(notification);

      case 'REFUND':
      case 'REVOKE':
        return this.cancelTransaction(notification);

      case 'TEST':
      case 'REFUND_DECLINED':
      case 'CONSUMPTION_REQUEST':
      case 'EXTERNAL_PURCHASE_TOKEN':
      case 'ONE_TIME_CHARGE':
      case 'RENEWAL_EXTENSION':
        return 'NO_ACTION';
    }
  }

  private async syncTransaction(
    notification: AppleServerNotificationPayload,
  ): Promise<AppleNotificationAction> {
    const transaction = this.decodeRequiredTransaction(notification);

    const product = this.products.require(transaction.productId);

    const updated = await this.subscriptions.syncAppleSubscriptionTransaction({
      originalTransactionId: transaction.originalTransactionId,
      plan: product.plan,
      currentPeriodEnd: transaction.expiresDate,
      purchasedAt: transaction.purchaseDate,
      revokedAt: transaction.revocationDate,
    });

    return updated ? 'SUBSCRIPTION_SYNCED' : 'SUBSCRIPTION_NOT_FOUND';
  }

  private async expireTransaction(
    notification: AppleServerNotificationPayload,
  ): Promise<AppleNotificationAction> {
    const transaction = this.decodeRequiredTransaction(notification);

    const updated = await this.subscriptions.expireAppleSubscription(
      transaction.originalTransactionId,
      transaction.expiresDate,
    );

    return updated ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_NOT_FOUND';
  }

  private async cancelTransaction(
    notification: AppleServerNotificationPayload,
  ): Promise<AppleNotificationAction> {
    const transaction = this.decodeRequiredTransaction(notification);

    const updated = await this.subscriptions.cancelAppleSubscription(
      transaction.originalTransactionId,
      transaction.revocationDate ?? new Date(),
    );

    return updated ? 'SUBSCRIPTION_CANCELLED' : 'SUBSCRIPTION_NOT_FOUND';
  }

  private decodeRequiredTransaction(notification: AppleServerNotificationPayload) {
    const signedTransactionInfo = notification.data.signedTransactionInfo;

    if (!signedTransactionInfo) {
      throw new BadRequestException(
        'Apple notification does not contain signed transaction information.',
      );
    }

    return this.transactions.decode(signedTransactionInfo);
  }

  private validateApplication(notification: AppleServerNotificationPayload): void {
    const expectedBundleId = process.env.APPLE_BUNDLE_ID ?? 'com.neighbour.app';

    if (notification.data.bundleId !== expectedBundleId) {
      throw new BadRequestException(
        'Apple notification bundle identifier does not match this application.',
      );
    }

    const expectedEnvironment = process.env.APPLE_IAP_ENVIRONMENT;

    if (expectedEnvironment && notification.data.environment !== expectedEnvironment) {
      throw new BadRequestException(
        'Apple notification environment does not match this deployment.',
      );
    }
  }
}
