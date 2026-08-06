import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MarketplaceFulfilmentMethod,
  MarketplaceFulfilmentStatus,
} from '../../../src/generated/prisma/client';

test('FulfilmentOS supports collection, delivery and postage', () => {
  assert.equal(MarketplaceFulfilmentMethod.COLLECTION, 'COLLECTION');

  assert.equal(MarketplaceFulfilmentMethod.DELIVERY, 'DELIVERY');

  assert.equal(MarketplaceFulfilmentMethod.POSTAGE, 'POSTAGE');
});

test('FulfilmentOS exposes terminal states', () => {
  assert.equal(MarketplaceFulfilmentStatus.COMPLETED, 'COMPLETED');

  assert.equal(MarketplaceFulfilmentStatus.CANCELLED, 'CANCELLED');

  assert.equal(MarketplaceFulfilmentStatus.EXPIRED, 'EXPIRED');
});
