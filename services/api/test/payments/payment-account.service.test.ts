import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PaymentAccountService } from '../../src/payments/account/payment-account.service';

describe('PaymentAccountService', () => {
  it('creates payment accounts', () => {
    const service = new PaymentAccountService();

    const result = service.create({
      id: 'account-1',
      ownerId: 'business-1',
      ownerType: 'business',
      status: 'active',
      createdAt: new Date(),
    });

    assert.equal(result.status, 'active');
  });
});
