import assert from 'node:assert/strict';
import test from 'node:test';

import { NearbyDistanceService } from '../../src/nearby/services/distance.service';

test('NearbyOS calculates realistic distance between Manchester points', () => {
  const service = new NearbyDistanceService();

  const distance = service.calculateKilometres(
    {
      latitude: 53.4808,
      longitude: -2.2426,
    },
    {
      latitude: 53.4831,
      longitude: -2.2004,
    },
  );

  assert.ok(distance > 2);

  assert.ok(distance < 4);
});

test('NearbyOS bounding box contains its origin', () => {
  const service = new NearbyDistanceService();

  const origin = {
    latitude: 53.4808,
    longitude: -2.2426,
  };

  const bounds = service.boundingBox(origin, 8);

  assert.ok(origin.latitude >= bounds.minimumLatitude);

  assert.ok(origin.latitude <= bounds.maximumLatitude);

  assert.ok(origin.longitude >= bounds.minimumLongitude);

  assert.ok(origin.longitude <= bounds.maximumLongitude);
});
