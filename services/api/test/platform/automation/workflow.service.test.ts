import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { WorkflowService } from '../../../src/platform/automation/workflows/workflow.service';

describe('WorkflowService', () => {
  it('creates workflow definitions', () => {
    const service = new WorkflowService();

    const result = service.create({
      id: 'workflow-1',
      name: 'health-check',
      steps: ['check'],
      active: true,
    });

    assert.equal(result.active, true);
  });
});
