import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MobileContextService } from '../../src/mobile/mobile-context.service';

describe('MobileContextService', () => {
  it('creates mobile context', () => {
    const service = new MobileContextService();

    const result = service.createContext('user-1', 'device-1');

    assert.equal(result.userId, 'user-1');
  });
});
