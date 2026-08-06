import 'reflect-metadata';

import assert from 'node:assert/strict';
import test from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { NearbyQueryDto } from '../../src/nearby/dto/nearby-query.dto';

test('NearbyOS accepts a valid location query', async () => {
  const dto = plainToInstance(NearbyQueryDto, {
    latitude: '53.4808',
    longitude: '-2.2426',
    radiusKm: '8',
    limit: '40',
    sort: 'RELEVANCE',
  });

  const errors = await validate(dto);

  assert.equal(errors.length, 0);

  assert.equal(dto.latitude, 53.4808);

  assert.equal(dto.radiusKm, 8);
});

test('NearbyOS rejects an impossible latitude', async () => {
  const dto = plainToInstance(NearbyQueryDto, {
    latitude: '200',
    longitude: '0',
  });

  const errors = await validate(dto);

  assert.ok(errors.length > 0);
});
