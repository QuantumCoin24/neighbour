import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from 'class-validator';

import {
  CreateMarketplaceModerationCaseDto,
  MarketplaceModerationReasonDto,
  MarketplaceModerationSubjectTypeDto,
} from '../../../src/marketplace/moderation/dto/create-marketplace-moderation-case.dto';

test('ModerationOS accepts a valid moderation case', async () => {
  const dto = new CreateMarketplaceModerationCaseDto();

  dto.subjectType = MarketplaceModerationSubjectTypeDto.LISTING;
  dto.subjectId = '00000000-0000-4000-8000-000000000001';
  dto.reason = MarketplaceModerationReasonDto.FRAUD_SUSPECTED;
  dto.title = 'Suspicious Marketplace listing';
  dto.description = 'The listing contains multiple indicators requiring manual review.';

  const errors = await validate(dto);

  assert.equal(errors.length, 0);
});
