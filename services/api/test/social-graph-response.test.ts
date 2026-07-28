import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  ConnectionResponse,
  RelationshipStatusResponse,
} from '../src/social-graph/interfaces/social-graph-response.interface';

describe('social graph response contracts', () => {
  it('supports a safe connection response', () => {
    const response: ConnectionResponse = {
      id: 'connection-id',
      status: 'CONNECTED',
      direction: 'CONNECTED',
      user: {
        id: 'user-id',
        displayName: 'Neighbour Member',
        username: 'neighbour-member',
        avatarUrl: null,
        localArea: null,
      },
      createdAt: new Date('2026-07-28T00:00:00.000Z'),
      updatedAt: new Date('2026-07-28T00:00:00.000Z'),
      connectedAt: new Date('2026-07-28T00:00:00.000Z'),
    };

    assert.equal(response.status, 'CONNECTED');
    assert.equal(response.user.username, 'neighbour-member');
    assert.equal(response.user.localArea, null);
  });

  it('supports all relationship status categories', () => {
    const statuses: RelationshipStatusResponse['status'][] = [
      'NONE',
      'OUTGOING_REQUEST',
      'INCOMING_REQUEST',
      'CONNECTED',
      'BLOCKED_BY_ME',
      'BLOCKED_ME',
    ];

    assert.equal(statuses.length, 6);
  });
});
