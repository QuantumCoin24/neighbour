import assert from 'node:assert/strict';
import test from 'node:test';

import { AppleTransactionDecoderService } from '../../../src/payments/apple/services/apple-transaction-decoder.service';

function unsignedFixture(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({
      alg: 'ES256',
      kid: 'TEST',
    }),
  ).toString('base64url');

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${header}.${body}.signature`;
}

test('Apple Commerce decodes a StoreKit transaction payload', () => {
  const service = new AppleTransactionDecoderService();

  const transaction = service.decode(
    unsignedFixture({
      transactionId: '2000000001',
      originalTransactionId: '1000000001',
      productId: 'neighbour.plus.monthly',
      bundleId: 'com.neighbour.app',
      purchaseDate: 1_700_000_000_000,
      expiresDate: 1_702_592_000_000,
      environment: 'Sandbox',
    }),
  );

  assert.equal(transaction.productId, 'neighbour.plus.monthly');

  assert.equal(transaction.environment, 'Sandbox');

  assert.equal(transaction.originalTransactionId, '1000000001');
});
