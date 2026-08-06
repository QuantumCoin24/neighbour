import assert from 'node:assert/strict';
import test from 'node:test';

import type { DatabaseService } from '../../src/database/database.service';
import { NearbyDistanceService } from '../../src/nearby/services/distance.service';
import { NearbyService } from '../../src/nearby/services/nearby.service';
import { NearbyRadiusService } from '../../src/nearby/services/radius.service';
import { NearbyRankingService } from '../../src/nearby/services/ranking.service';

test('NearbyOS reports its production capabilities', () => {
  const service = new NearbyService(
    {} as DatabaseService,
    new NearbyDistanceService(),
    new NearbyRadiusService(),
    new NearbyRankingService(),
  );

  const health = service.health();

  assert.equal(health.status, 'operational');

  assert.equal(health.module, 'NearbyOS');

  assert.deepEqual(health.capabilities, [
    'RADIUS_SEARCH',
    'DISTANCE_CALCULATION',
    'MULTI_DOMAIN_RESULTS',
    'RELEVANCE_RANKING',
  ]);
});
