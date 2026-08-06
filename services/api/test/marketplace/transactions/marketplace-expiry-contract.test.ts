import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MarketplaceOfferStatus,
  MarketplaceTransactionStatus,
} from '../../../src/generated/prisma/client';

test('TransactionOS exposes terminal expiry states', () => {
  assert.equal(MarketplaceOfferStatus.EXPIRED, 'EXPIRED');

  assert.equal(MarketplaceOfferStatus.CANCELLED, 'CANCELLED');

  assert.equal(MarketplaceTransactionStatus.CANCELLED, 'CANCELLED');
});
