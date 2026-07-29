import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ExportService } from '../../src/data/export/export.service';

describe('ExportService', () => {
  it('creates export requests', () => {
    const service = new ExportService();

    const result = service.request({
      id: 'export-1',
      userId: 'user-1',
      status: 'requested',
      createdAt: new Date(),
    });

    assert.equal(result.status, 'requested');
  });
});
