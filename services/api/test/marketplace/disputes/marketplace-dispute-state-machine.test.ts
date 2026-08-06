import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplaceDisputeStateMachineService } from '../../../src/marketplace/disputes/state-machine/marketplace-dispute-state-machine.service';

test('DisputeOS permits valid escalation', () => {
  const service = new MarketplaceDisputeStateMachineService();

  assert.equal(service.canTransition('OPEN', 'ESCALATED'), true);

  assert.equal(service.canTransition('ESCALATED', 'RESOLVED'), true);
});

test('DisputeOS prevents reopening closed disputes', () => {
  const service = new MarketplaceDisputeStateMachineService();

  assert.equal(service.canTransition('CLOSED', 'OPEN'), false);
});
