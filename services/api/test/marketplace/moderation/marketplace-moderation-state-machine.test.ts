import assert from 'node:assert/strict';
import test from 'node:test';

import { MarketplaceModerationStateMachineService } from '../../../src/marketplace/moderation/state-machine/marketplace-moderation-state-machine.service';

test('ModerationOS supports review and appeal transitions', () => {
  const service = new MarketplaceModerationStateMachineService();

  assert.equal(service.canTransition('OPEN', 'UNDER_REVIEW'), true);

  assert.equal(service.canTransition('RESOLVED', 'APPEALED'), true);
});

test('closed moderation cases cannot reopen directly', () => {
  const service = new MarketplaceModerationStateMachineService();

  assert.equal(service.canTransition('CLOSED', 'OPEN'), false);
});
