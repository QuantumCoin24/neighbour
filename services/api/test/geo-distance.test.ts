import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateDistanceKm, createGeoBounds } from '../src/geo/utils/geo-distance';

test('calculates a stable distance between Manchester and Salford', () => {
  const distance = calculateDistanceKm(
    {
      latitude: 53.4808,
      longitude: -2.2426,
    },
    {
      latitude: 53.4875,
      longitude: -2.2901,
    },
  );

  assert.ok(distance > 3);
  assert.ok(distance < 4);
});

test('creates bounds containing the origin', () => {
  const origin = {
    latitude: 53.4808,
    longitude: -2.2426,
  };

  const bounds = createGeoBounds(origin, 10);

  assert.ok(bounds.north > origin.latitude);
  assert.ok(bounds.south < origin.latitude);
  assert.ok(bounds.east > origin.longitude);
  assert.ok(bounds.west < origin.longitude);
});
