export type AppleNotificationType =
  | 'CONSUMPTION_REQUEST'
  | 'DID_CHANGE_RENEWAL_PREF'
  | 'DID_CHANGE_RENEWAL_STATUS'
  | 'DID_FAIL_TO_RENEW'
  | 'DID_RENEW'
  | 'EXPIRED'
  | 'EXTERNAL_PURCHASE_TOKEN'
  | 'GRACE_PERIOD_EXPIRED'
  | 'OFFER_REDEEMED'
  | 'ONE_TIME_CHARGE'
  | 'PRICE_INCREASE'
  | 'REFUND'
  | 'REFUND_DECLINED'
  | 'REFUND_REVERSED'
  | 'RENEWAL_EXTENDED'
  | 'RENEWAL_EXTENSION'
  | 'REVOKE'
  | 'SUBSCRIBED'
  | 'TEST';

export interface RawAppleServerNotification {
  notificationType?: unknown;
  subtype?: unknown;
  notificationUUID?: unknown;
  version?: unknown;
  signedDate?: unknown;
  data?: unknown;
}

export interface RawAppleNotificationData {
  appAppleId?: unknown;
  bundleId?: unknown;
  bundleVersion?: unknown;
  environment?: unknown;
  signedTransactionInfo?: unknown;
  signedRenewalInfo?: unknown;
  status?: unknown;
}

export interface AppleServerNotificationPayload {
  notificationType: AppleNotificationType;
  subtype: string | null;
  notificationUUID: string;
  version: string;
  signedDate: Date;
  data: {
    appAppleId: number | null;
    bundleId: string;
    bundleVersion: string | null;
    environment: 'Sandbox' | 'Production';
    signedTransactionInfo: string | null;
    signedRenewalInfo: string | null;
    status: number | null;
  };
}
