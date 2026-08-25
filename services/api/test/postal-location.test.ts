import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeCountryCode,
  normalizePostalCode,
  normalizePostalInput,
} from '../src/geo/utils/postal-location';

test('normalizes country codes', () => {
  assert.equal(normalizeCountryCode(' gb '), 'GB');
  assert.equal(normalizeCountryCode('us'), 'US');
});

test('normalizes UK postcode spacing', () => {
  assert.equal(normalizePostalCode('GB', 'm9 8ab'), 'M9 8AB');
  assert.equal(normalizePostalCode('gb', 'SW1A1AA'), 'SW1A 1AA');
});

test('preserves US ZIP', () => {
  assert.equal(normalizePostalCode('US', '90210'), '90210');
});

test('preserves US ZIP+4', () => {
  assert.equal(normalizePostalCode('US', '12345-6789'), '12345-6789');
});

test('normalizes Canadian postal codes without imposing UK formatting', () => {
  assert.equal(normalizePostalCode('CA', 'm5v 3l9'), 'M5V 3L9');
});

test('preserves numeric international postal codes', () => {
  assert.equal(normalizePostalCode('NO', '0150'), '0150');
  assert.equal(normalizePostalCode('AU', '2000'), '2000');
});

test('normalizes combined postal input', () => {
  assert.deepEqual(normalizePostalInput(' gb ', ' m9 8ab '), {
    countryCode: 'GB',
    postalCode: 'M9 8AB',
  });
});

test('GB and UK country codes use canonical GB identity', () => {
  assert.equal(normalizeCountryCode('gb'), 'GB');
  assert.equal(normalizeCountryCode('uk'), 'UK');

  assert.deepEqual(normalizePostalInput('GB', 'sw1a1aa'), {
    countryCode: 'GB',
    postalCode: 'SW1A 1AA',
  });

  assert.deepEqual(normalizePostalInput('UK', 'sw1a1aa'), {
    countryCode: 'UK',
    postalCode: 'SW1A 1AA',
  });
});
