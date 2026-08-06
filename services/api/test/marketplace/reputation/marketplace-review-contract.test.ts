import assert from 'node:assert/strict';
import test from 'node:test';
import { validate } from 'class-validator';

import { CreateMarketplaceReviewDto } from '../../../src/marketplace/reputation/dto/create-marketplace-review.dto';

test('ReputationOS accepts a valid verified-trade review', async () => {
  const dto = new CreateMarketplaceReviewDto();

  dto.transactionId = '00000000-0000-4000-8000-000000000001';
  dto.rating = 5;
  dto.comment = 'Excellent local transaction.';

  const errors = await validate(dto);

  assert.equal(errors.length, 0);
});

test('ReputationOS rejects ratings above five', async () => {
  const dto = new CreateMarketplaceReviewDto();

  dto.transactionId = '00000000-0000-4000-8000-000000000001';
  dto.rating = 6;

  const errors = await validate(dto);

  assert.ok(errors.length > 0);
});
