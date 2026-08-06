import assert from 'node:assert/strict';
import test from 'node:test';

import { NearbyRankingService } from '../../src/nearby/services/ranking.service';

test('NearbyOS ranks a close verified result above a distant unverified result', () => {
  const service = new NearbyRankingService();

  const closeVerified = service.calculate({
    distanceKm: 0.5,
    radiusKm: 8,
    verified: true,
    popularity: 60,
    freshness: 80,
    trustScore: 75,
  });

  const distantUnverified = service.calculate({
    distanceKm: 7.5,
    radiusKm: 8,
    verified: false,
    popularity: 20,
    freshness: 20,
    trustScore: 10,
  });

  assert.ok(closeVerified > distantUnverified);
});

test('NearbyOS relevance score remains bounded', () => {
  const service = new NearbyRankingService();

  const score = service.calculate({
    distanceKm: 0,
    radiusKm: 1,
    verified: true,
    popularity: 1_000,
    freshness: 1_000,
    trustScore: 1_000,
    startsAt: new Date(Date.now() + 60_000),
  });

  assert.ok(score >= 0);
  assert.ok(score <= 100);
});
