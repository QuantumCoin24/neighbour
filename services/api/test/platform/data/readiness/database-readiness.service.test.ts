import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { DatabaseReadinessService } from '../../../../src/platform/data/readiness/database-readiness.service';


describe('DatabaseReadinessService', () => {


  it('marks production data as ready', () => {


    const service =
      new DatabaseReadinessService();


    const result =
      service.evaluate({

        domain: 'database',

        schema: 'READY',

        migrations: 'READY',

        backups: 'READY',

        status: 'READY',

      });


    assert.equal(
      result.ready,
      true,
    );


  });


});
