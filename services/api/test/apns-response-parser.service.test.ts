import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsResponseParserService } from '../src/notification/transport/apns-response-parser.service';

describe('ApnsResponseParserService', () => {
  it('parses successful responses', () => {
    const parser = new ApnsResponseParserService();

    assert.deepEqual(parser.parse(200), {
      accepted: true,
      status: 200,
    });
  });

  it('extracts APNs error reasons', () => {
    const parser = new ApnsResponseParserService();

    assert.deepEqual(
      parser.parse(
        400,
        JSON.stringify({
          reason: 'BadDeviceToken',
        }),
      ),
      {
        accepted: false,
        status: 400,
        reason: 'BadDeviceToken',
      },
    );
  });

  it('ignores malformed JSON', () => {
    const parser = new ApnsResponseParserService();

    assert.deepEqual(parser.parse(500, 'not-json'), {
      accepted: false,
      status: 500,
    });
  });
});
