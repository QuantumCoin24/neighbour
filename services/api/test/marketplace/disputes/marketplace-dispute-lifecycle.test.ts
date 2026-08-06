import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MarketplaceDisputeEventType,
  MarketplaceDisputePriority,
  MarketplaceDisputeStatus,
} from '../../../src/generated/prisma/client';

test('DisputeOS exposes participant lifecycle states', () => {
  assert.equal(MarketplaceDisputeStatus.AWAITING_RESPONSE, 'AWAITING_RESPONSE');

  assert.equal(MarketplaceDisputeStatus.UNDER_REVIEW, 'UNDER_REVIEW');

  assert.equal(MarketplaceDisputeStatus.ESCALATED, 'ESCALATED');
});

test('DisputeOS exposes evidence and escalation events', () => {
  assert.equal(MarketplaceDisputeEventType.EVIDENCE_ADDED, 'EVIDENCE_ADDED');

  assert.equal(MarketplaceDisputeEventType.ESCALATED, 'ESCALATED');

  assert.equal(MarketplaceDisputePriority.URGENT, 'URGENT');
});
