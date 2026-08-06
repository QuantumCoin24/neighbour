import assert from 'node:assert/strict';
import test from 'node:test';

import { PlatformRole } from '../../src/generated/prisma/client';
import { ROLES_KEY } from '../../src/auth/decorators/roles.decorator';
import { MarketplaceDisputeController } from '../../src/marketplace/disputes/controllers/marketplace-dispute.controller';
import { MarketplaceModerationController } from '../../src/marketplace/moderation/controllers/marketplace-moderation.controller';

const STAFF_ROLES = [PlatformRole.MODERATOR, PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN];

function methodRoles(controller: object, methodName: string): PlatformRole[] {
  const method = Object.getOwnPropertyDescriptor(controller, methodName)?.value;

  assert.equal(typeof method, 'function', `${methodName} must exist`);

  return (Reflect.getMetadata(ROLES_KEY, method) ?? []) as PlatformRole[];
}

test('DisputeOS overdue processing requires staff access', () => {
  assert.deepEqual(
    methodRoles(MarketplaceDisputeController.prototype, 'processOverdue'),
    STAFF_ROLES,
  );
});

test('ModerationOS operational routes require staff access', () => {
  for (const method of [
    'listQueue',
    'findOne',
    'assign',
    'addFraudSignal',
    'updateStatus',
    'recalculateRisk',
  ]) {
    assert.deepEqual(methodRoles(MarketplaceModerationController.prototype, method), STAFF_ROLES);
  }
});

test('Authenticated users may still submit moderation cases', () => {
  assert.deepEqual(methodRoles(MarketplaceModerationController.prototype, 'createCase'), []);
});
