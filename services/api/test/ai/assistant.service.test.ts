import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AssistantService } from '../../src/ai/assistant/assistant.service';

describe('AssistantService', () => {
  it('stores assistant conversations', () => {
    const service = new AssistantService();

    const result = service.ask({
      id: 'assistant-1',
      userId: 'user-1',
      prompt: 'Find my local community',
      response: 'Community found',
      createdAt: new Date(),
    });

    assert.equal(result.userId, 'user-1');
  });
});
