import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MarketplaceModerationEventType,
  MarketplaceModerationPriority,
  MarketplaceModerationStatus,
  MarketplaceModerationSubjectType,
} from '../../../src/generated/prisma/client';

test('ModerationOS exposes operational case states', () => {
  assert.equal(MarketplaceModerationStatus.OPEN, 'OPEN');

  assert.equal(MarketplaceModerationStatus.UNDER_REVIEW, 'UNDER_REVIEW');

  assert.equal(MarketplaceModerationStatus.APPEALED, 'APPEALED');
});

test('ModerationOS exposes audit and risk contracts', () => {
  assert.equal(MarketplaceModerationPriority.CRITICAL, 'CRITICAL');

  assert.equal(MarketplaceModerationSubjectType.DISPUTE, 'DISPUTE');

  assert.equal(MarketplaceModerationEventType.RISK_RECALCULATED, 'RISK_RECALCULATED');
});
