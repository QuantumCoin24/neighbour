import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createConnectionPair,
  getOtherUserId,
} from '../src/social-graph/utils/connection-pair.util';

describe('connection pair utility', () => {
  it('creates the same canonical pair regardless of input order', () => {
    const first = createConnectionPair('user-b', 'user-a');
    const second = createConnectionPair('user-a', 'user-b');

    assert.deepEqual(first, {
      userAId: 'user-a',
      userBId: 'user-b',
    });

    assert.deepEqual(second, first);
  });

  it('returns the other user in the pair', () => {
    const pair = createConnectionPair('user-a', 'user-b');

    assert.equal(getOtherUserId('user-a', pair), 'user-b');
    assert.equal(getOtherUserId('user-b', pair), 'user-a');
  });

  it('rejects self-connections', () => {
    assert.throws(
      () => createConnectionPair('user-a', 'user-a'),
      /cannot form a connection pair with themselves/,
    );
  });

  it('rejects users who do not belong to the pair', () => {
    const pair = createConnectionPair('user-a', 'user-b');

    assert.throws(() => getOtherUserId('user-c', pair), /does not belong to this connection pair/);
  });
});
