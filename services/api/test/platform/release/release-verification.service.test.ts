import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { ReleaseVerificationService } from '../../../src/platform/release/release-verification.service';


describe('ReleaseVerificationService', () => {


  it('marks release candidates as verified', () => {


    const service =
      new ReleaseVerificationService();


    const result =
      service.verify({

        build: 'PASS',

        tests: 'PASS',

        verification: 'PASS',

        launch: 'READY',

        status: 'READY',

      });


    assert.equal(
      result.verified,
      true,
    );


  });


});
