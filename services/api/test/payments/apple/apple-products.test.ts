import assert from 'node:assert/strict';
import test from 'node:test';

import { AppleProductService } from '../../../src/payments/apple/services/apple-product.service';

test('Apple Commerce exposes four subscription products', () => {
  const service = new AppleProductService();

  const products = service.list();

  assert.equal(products.length, 4);

  assert.deepEqual(
    products.map((product) => product.productId),
    [
      'neighbour.plus.monthly',
      'neighbour.plus.yearly',
      'neighbour.business.monthly',
      'neighbour.business.yearly',
    ],
  );
});

test('Apple Commerce maps products to subscription plans', () => {
  const service = new AppleProductService();

  assert.equal(service.require('neighbour.plus.monthly').plan, 'PLUS');

  assert.equal(service.require('neighbour.business.yearly').plan, 'BUSINESS');
});
