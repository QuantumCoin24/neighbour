import assert from 'node:assert/strict';
import test from 'node:test';

import { AppleServerNotificationDecoderService } from '../../../src/payments/apple/notifications/apple-server-notification-decoder.service';

function encode(payload: Record<string, unknown>): string {
  return [
    Buffer.from(
      JSON.stringify({
        alg: 'ES256',
      }),
    ).toString('base64url'),
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
    'signature',
  ].join('.');
}

test('decodes an App Store Server Notification V2 payload', () => {
  const service = new AppleServerNotificationDecoderService();

  const notification = service.decode(
    encode({
      notificationType: 'DID_RENEW',
      subtype: null,
      notificationUUID: '5adfd3d1-45a3-4e80-bfb5-52e814444901',
      version: '2.0',
      signedDate: Date.now(),
      data: {
        bundleId: 'com.neighbour.app',
        environment: 'Sandbox',
        signedTransactionInfo: 'header.payload.signature',
      },
    }),
  );

  assert.equal(notification.notificationType, 'DID_RENEW');

  assert.equal(notification.data.bundleId, 'com.neighbour.app');

  assert.equal(notification.data.environment, 'Sandbox');
});
