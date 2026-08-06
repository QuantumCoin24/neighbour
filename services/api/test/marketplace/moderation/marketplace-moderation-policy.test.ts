import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplaceModerationPolicyService } from '../../../src/marketplace/moderation/policy/marketplace-moderation-policy.service';

test('critical cases recommend restrictive safeguards', () => {
  const service = new MarketplaceModerationPolicyService();

  const actions = service.getRecommendedActions('CRITICAL');

  assert.ok(actions.includes('ACCOUNT_SUSPENDED'));

  assert.ok(actions.includes('PAYMENT_HOLD'));
});

test('severe sanctions require a second reviewer', () => {
  const service = new MarketplaceModerationPolicyService();

  assert.equal(service.requiresSecondReviewer('ACCOUNT_TERMINATED'), true);

  assert.equal(service.requiresSecondReviewer('WARNING'), false);
});
