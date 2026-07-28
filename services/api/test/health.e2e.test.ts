import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { HealthModule } from '../src/health/health.module';

describe('Health endpoint', () => {
  let app: INestApplication;

  before(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      defaultVersion: '1',
      type: VersioningType.URI,
    });

    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    assert.equal(response.body.service, 'neighbour-api');
    assert.equal(response.body.status, 'ok');
  });
});
