import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createUsernameCandidate,
  normaliseUsername,
} from '../src/profile/utils/profile-username.util';

describe('profile username utilities', () => {
  it('normalises usernames', () => {
    assert.equal(normaliseUsername('  Jason.Greaves  '), 'jason.greaves');
  });

  it('creates a stable username candidate', () => {
    assert.equal(
      createUsernameCandidate('Jason-Paul Greaves', '12345678-1234-1234-1234-123456789012'),
      'jason.paul.greaves.12345678',
    );
  });

  it('creates a safe fallback username', () => {
    assert.equal(
      createUsernameCandidate('***', 'abcdef12-1234-1234-1234-123456789012'),
      'neighbour.abcdef12',
    );
  });
});
