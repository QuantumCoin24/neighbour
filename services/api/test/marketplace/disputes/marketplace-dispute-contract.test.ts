import assert from 'node:assert/strict';
import test from 'node:test';
import { validate } from 'class-validator';

import {
  CreateMarketplaceDisputeDto,
  MarketplaceDisputeReasonDto,
} from '../../../src/marketplace/disputes/dto/create-marketplace-dispute.dto';

test('DisputeOS accepts a valid transaction dispute', async () => {
  const dto = new CreateMarketplaceDisputeDto();

  dto.transactionId = '00000000-0000-4000-8000-000000000001';
  dto.reason = MarketplaceDisputeReasonDto.ITEM_NOT_RECEIVED;
  dto.title = 'Marketplace item not received';
  dto.description = 'The fulfilment timeline says delivered, but the item was not received.';

  const errors = await validate(dto);

  assert.equal(errors.length, 0);
});

test('DisputeOS rejects an invalid transaction identifier', async () => {
  const dto = new CreateMarketplaceDisputeDto();

  dto.transactionId = 'invalid';
  dto.reason = MarketplaceDisputeReasonDto.OTHER;
  dto.title = 'Dispute';
  dto.description = 'A valid description for the dispute.';

  const errors = await validate(dto);

  assert.ok(errors.length > 0);
});
