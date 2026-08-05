import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateCommunityDto } from '../src/community/dto/create-community.dto';
import { CommunityVisibility } from '../src/generated/prisma/client.js';

describe('CreateCommunityDto', () => {
  it('normalises a valid community request', async () => {
    const dto = plainToInstance(CreateCommunityDto, {
      name: '  Blackley Neighbours  ',
      description: '  A community for local residents.  ',
      visibility: CommunityVisibility.PUBLIC,
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.name, 'Blackley Neighbours');
    assert.equal(dto.description, 'A community for local residents.');
    assert.equal(dto.visibility, CommunityVisibility.PUBLIC);
  });

  it('rejects a community name that is too short', async () => {
    const dto = plainToInstance(CreateCommunityDto, {
      name: 'AB',
    });

    const errors = await validate(dto);

    assert.ok(errors.some((error) => error.property === 'name'));
  });
});
