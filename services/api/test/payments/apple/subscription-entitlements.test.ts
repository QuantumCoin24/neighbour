import assert from 'node:assert/strict';
import test from 'node:test';

import type { DatabaseService } from '../../../src/database/database.service';
import { SubscriptionService } from '../../../src/payments/subscription/subscription.service';

test('Neighbour Plus grants consumer premium entitlements', () => {
  const service = new SubscriptionService({} as DatabaseService);

  const entitlements = service.getEntitlements('PLUS');

  assert.equal(entitlements.premiumProfile, true);

  assert.equal(entitlements.advancedSearch, true);

  assert.equal(entitlements.businessAnalytics, false);
});

test('Neighbour Business grants every current entitlement', () => {
  const service = new SubscriptionService({} as DatabaseService);

  const entitlements = service.getEntitlements('BUSINESS');

  assert.ok(Object.values(entitlements).every(Boolean));
});
