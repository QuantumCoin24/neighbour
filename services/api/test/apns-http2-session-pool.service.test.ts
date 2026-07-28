import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsHttp2SessionPoolService } from '../src/notification/transport/apns-http2-session-pool.service';

describe('ApnsHttp2SessionPoolService', () => {
  it('reuses an existing session', () => {
    const pool = new ApnsHttp2SessionPoolService();

    const first = pool.acquire('primary');
    const second = pool.acquire('primary');

    assert.strictEqual(first, second);
    assert.equal(pool.size(), 1);
  });

  it('marks sessions inactive when released', () => {
    const pool = new ApnsHttp2SessionPoolService();

    const session = pool.acquire('primary');

    pool.release('primary');

    assert.equal(session.active, false);
  });

  it('clears the session pool', () => {
    const pool = new ApnsHttp2SessionPoolService();

    pool.acquire('one');
    pool.acquire('two');

    pool.clear();

    assert.equal(pool.size(), 0);
  });
});
