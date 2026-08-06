import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateMarketplaceListingDto } from '../../src/marketplace/listings/dto/create-marketplace-listing.dto';

describe('MarketplaceOS listing contract', () => {
  it('accepts a valid paid listing', async () => {
    const dto = plainToInstance(CreateMarketplaceListingDto, {
      title: 'Children’s bicycle',
      description: 'A well cared for bicycle suitable for a young child.',
      category: 'SPORTS',
      condition: 'GOOD',
      status: 'PUBLISHED',
      pricePence: 4500,
      collectionAvailable: true,
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
  });

  it('accepts a free listing', async () => {
    const dto = plainToInstance(CreateMarketplaceListingDto, {
      title: 'Free garden pots',
      description: 'Collection of used plant pots available for free.',
      category: 'FREE_ITEMS',
      condition: 'FAIR',
      isFree: true,
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
  });

  it('rejects more than nine media assets', async () => {
    const dto = plainToInstance(CreateMarketplaceListingDto, {
      title: 'Large listing',
      description: 'A listing with too many attached media assets.',
      category: 'OTHER',
      condition: 'GOOD',
      pricePence: 1000,
      mediaIds: Array.from(
        {
          length: 10,
        },
        (_, index) => `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
      ),
    });

    const errors = await validate(dto);

    assert.ok(errors.length > 0);
  });
});
