import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateProfileDto } from '../src/profile/dto/update-profile.dto';

describe('UpdateProfileDto', () => {
  it('normalises a valid profile update', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      username: '  Jason.Greaves  ',
      bio: '  Manchester neighbour and community builder.  ',
      avatarUrl: 'https://example.com/avatar.jpg',
      localArea: '  Blackley  ',
      showLocalArea: true,
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.username, 'jason.greaves');
    assert.equal(dto.bio, 'Manchester neighbour and community builder.');
    assert.equal(dto.localArea, 'Blackley');
    assert.equal(dto.showLocalArea, true);
  });

  it('normalises spaces in a username to handle-safe dots', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      username: 'invalid username',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.username, 'invalid.username');
  });

  it('rejects an invalid avatar URL', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      avatarUrl: 'not-a-url',
    });

    const errors = await validate(dto);

    assert.ok(errors.some((error) => error.property === 'avatarUrl'));
  });
});
