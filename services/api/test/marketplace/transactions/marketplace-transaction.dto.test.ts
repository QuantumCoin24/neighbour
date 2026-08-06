import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from 'class-validator';

import { CounterMarketplaceOfferDto } from '../../../src/marketplace/transactions/dto/counter-marketplace-offer.dto';
import { CreateMarketplaceOfferDto } from '../../../src/marketplace/transactions/dto/create-marketplace-offer.dto';

test('accepts a valid marketplace offer', async () => {
  const dto = new CreateMarketplaceOfferDto();

  dto.amountPence = 5_000;
  dto.message = 'Would you accept £50?';
  dto.expiresInDays = 7;

  const errors = await validate(dto);

  assert.equal(errors.length, 0);
});

test('rejects a zero-value marketplace offer', async () => {
  const dto = new CreateMarketplaceOfferDto();

  dto.amountPence = 0;

  const errors = await validate(dto);

  assert.ok(errors.length > 0);
});

test('accepts a valid counter offer', async () => {
  const dto = new CounterMarketplaceOfferDto();

  dto.amountPence = 6_000;
  dto.message = 'I can do £60.';

  const errors = await validate(dto);

  assert.equal(errors.length, 0);
});
