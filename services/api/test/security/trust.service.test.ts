import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TrustService } from '../../src/security/trust/trust.service';


describe('TrustService', () => {

  it('creates a trust score', () => {

    const service = new TrustService();

    const result =
      service.calculate(
        'user-1',
        80,
      );


    assert.equal(
      result.score,
      80,
    );

  });

});
