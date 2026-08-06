import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplacePaymentMethodDto } from '../../../src/marketplace/payments/dto/create-marketplace-payment.dto';
import { ManualPaymentProvider } from '../../../src/marketplace/payments/providers/manual-payment.provider';

test('PaymentOS exposes provider-neutral payment methods', () => {
  assert.equal(MarketplacePaymentMethodDto.CASH_ON_COLLECTION, 'CASH_ON_COLLECTION');

  assert.equal(MarketplacePaymentMethodDto.BANK_TRANSFER, 'BANK_TRANSFER');

  assert.equal(MarketplacePaymentMethodDto.CARD, 'CARD');

  assert.equal(MarketplacePaymentMethodDto.APPLE_PAY, 'APPLE_PAY');

  assert.equal(MarketplacePaymentMethodDto.QFN, 'QFN');
});

test('manual payments use the manual provider', async () => {
  const provider = new ManualPaymentProvider();

  const result = await provider.createPayment({
    paymentId: '00000000-0000-4000-8000-000000000001',
    transactionId: '00000000-0000-4000-8000-000000000002',
    buyerId: '00000000-0000-4000-8000-000000000003',
    sellerId: '00000000-0000-4000-8000-000000000004',
    amountPence: 5_000,
    currency: 'GBP',
    method: 'BANK_TRANSFER',
  });

  assert.equal(result.provider, 'MANUAL');

  assert.equal(result.requiresAction, false);
});
