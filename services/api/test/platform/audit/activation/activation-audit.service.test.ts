import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { ActivationAuditService } from '../../../../src/platform/audit/activation/activation-audit.service';


describe('ActivationAuditService', () => {


  it('identifies active domains', () => {


    const service =
      new ActivationAuditService();


    const result =
      service.analyse({

        domain: 'auth',

        service: true,

        module: true,

        controller: true,

        database: true,

        status: '',

      });


    assert.equal(
      result.status,
      'ACTIVE',
    );


  });


});
