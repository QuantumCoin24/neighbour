import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { CommandService } from '../../../src/platform/command/command.service';


describe('CommandService', () => {

  it('creates platform commands', () => {

    const service =
      new CommandService();


    const result =
      service.create({

        id: 'command-1',

        type: 'health.check',

        payload: {},

        status: 'created',

        createdAt: new Date(),

      });


    assert.equal(

      result.type,

      'health.check'

    );

  });

});
