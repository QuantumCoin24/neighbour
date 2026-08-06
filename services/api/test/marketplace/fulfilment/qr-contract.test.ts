import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplaceVerificationType } from '../../../src/generated/prisma/client';

test('FulfilmentOS exposes QR verification', () => {
  assert.equal(MarketplaceVerificationType.QR, 'QR');
});
