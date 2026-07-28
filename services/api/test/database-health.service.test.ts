import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DatabaseHealthService } from '../src/database/database-health.service';
import type { DatabaseService } from '../src/database/database.service';

describe('DatabaseHealthService', () => {
  it('returns a healthy PostgreSQL payload after a successful ping', async () => {
    const database = {
      ping: async (): Promise<boolean> => true,
    } as DatabaseService;

    const service = new DatabaseHealthService(database);
    const response = await service.getHealth();

    assert.equal(response.database, 'postgresql');
    assert.equal(response.status, 'ok');
    assert.ok(response.timestamp);
  });
});
