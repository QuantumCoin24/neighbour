import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from '../src/auth/dto/register.dto';

describe('RegisterDto', () => {
  it('normalises a valid registration request', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: '  Person@Example.com ',
      displayName: '  Neighbour User  ',
      password: 'StrongPassword123',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.email, 'person@example.com');
    assert.equal(dto.displayName, 'Neighbour User');
  });

  it('rejects a weak password', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'person@example.com',
      displayName: 'Neighbour User',
      password: 'password',
    });

    const errors = await validate(dto);

    assert.ok(errors.some((error) => error.property === 'password'));
  });
});
