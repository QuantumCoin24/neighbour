import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { IntegrationService } from '../../src/integrations/registry/integration.service';


describe('IntegrationService', () => {

  it('registers integrations', () => {

    const service =
      new IntegrationService();


    const result =
      service.register({
        id: 'integration-1',
        name: 'Maps',
        provider: 'Provider',
        status: 'connected',
        createdAt: new Date(),
      });


    assert.equal(
      result.status,
      'connected',
    );

  });

});
