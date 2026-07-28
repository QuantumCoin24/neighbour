import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsResponseParserService } from '../src/notification/response/apns-response-parser.service';

describe('ApnsResponseParserService', () => {
  it('parses a successful response', () => {
    const service = new ApnsResponseParserService();

    assert.deepEqual(service.parse(200), {
      success: true,
      status: 200,
    });
  });

  it('parses an APNs error response', () => {
    const service = new ApnsResponseParserService();

    assert.deepEqual(
      service.parse(410, {
        reason: 'Unregistered',
      }),
      {
        success: false,
        status: 410,
        reason: 'Unregistered',
      },
    );
  });
});
