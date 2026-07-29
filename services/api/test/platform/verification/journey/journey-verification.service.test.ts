import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { JourneyVerificationService } from '../../../../src/platform/verification/journey/journey-verification.service';


describe('JourneyVerificationService', () => {


  it('verifies ready journey steps', () => {


    const service =
      new JourneyVerificationService();


    const result =
      service.verify({

        name: 'AUTH',

        category: 'IDENTITY',

        required: true,

        status: 'READY',

      });


    assert.equal(
      result.verified,
      true,
    );


  });


});
