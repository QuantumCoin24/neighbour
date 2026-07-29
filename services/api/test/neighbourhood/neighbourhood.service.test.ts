import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NeighbourhoodService } from '../../src/neighbourhood/neighbourhood.service';

describe('NeighbourhoodService', () => {
  it('creates neighbourhoods', async () => {
    const service = new NeighbourhoodService({
      save(item: unknown) {
        return Promise.resolve(item);
      },
    } as never);

    const result = await service.create({
      id: 'n1',
      name: 'Blackley',
      description: 'Local area',
      localArea: 'Manchester',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assert.equal(result.name, 'Blackley');
  });
});
