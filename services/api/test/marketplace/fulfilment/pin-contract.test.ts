import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplaceVerificationType } from '../../../src/generated/prisma/client';

test('FulfilmentOS exposes PIN verification', () => {
  assert.equal(MarketplaceVerificationType.PIN, 'PIN');
});
