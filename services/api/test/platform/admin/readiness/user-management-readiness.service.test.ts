import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { UserManagementReadinessService } from '../../../../src/platform/admin/readiness/user-management-readiness.service';


describe('UserManagementReadinessService', () => {


  it('marks user management as ready', () => {


    const service =
      new UserManagementReadinessService();


    const result =
      service.check(
        'READY',
      );


    assert.equal(
      result.ready,
      true,
    );


  });


});
