import assert from 'node:assert/strict';
import test from 'node:test';

import { SubscriptionService } from '../../../src/payments/subscription/subscription.service';

test('SubscriptionService exposes the complete Apple lifecycle', () => {
  assert.equal(typeof SubscriptionService.prototype.syncAppleSubscriptionTransaction, 'function');

  assert.equal(typeof SubscriptionService.prototype.expireAppleSubscription, 'function');

  assert.equal(typeof SubscriptionService.prototype.cancelAppleSubscription, 'function');
});
