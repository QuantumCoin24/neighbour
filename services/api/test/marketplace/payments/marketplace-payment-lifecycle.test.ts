import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MarketplacePaymentEventType,
  MarketplacePaymentStatus,
  MarketplaceRefundStatus,
} from '../../../src/generated/prisma/client';

test('PaymentOS exposes complete payment states', () => {
  assert.equal(MarketplacePaymentStatus.PENDING, 'PENDING');

  assert.equal(MarketplacePaymentStatus.CAPTURED, 'CAPTURED');

  assert.equal(MarketplacePaymentStatus.PARTIALLY_REFUNDED, 'PARTIALLY_REFUNDED');

  assert.equal(MarketplacePaymentStatus.REFUNDED, 'REFUNDED');
});

test('PaymentOS exposes refund lifecycle', () => {
  assert.equal(MarketplaceRefundStatus.PENDING, 'PENDING');

  assert.equal(MarketplaceRefundStatus.COMPLETED, 'COMPLETED');

  assert.equal(MarketplacePaymentEventType.REFUND_COMPLETED, 'REFUND_COMPLETED');
});
