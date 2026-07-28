import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { NotificationQueryDto } from '../src/notification/dto/notification-query.dto';

describe('Build 0010 notification DTO validation', () => {
  it('uses the default notification inbox options', async () => {
    const dto = plainToInstance(NotificationQueryDto, {});

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.limit, 30);
    assert.equal(dto.unreadOnly, false);
  });

  it('normalises query-string values', async () => {
    const dto = plainToInstance(NotificationQueryDto, {
      limit: '25',
      unreadOnly: 'true',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.limit, 25);
    assert.equal(dto.unreadOnly, true);
  });

  it('rejects an excessive inbox page size', async () => {
    const dto = plainToInstance(NotificationQueryDto, {
      limit: '101',
    });

    const errors = await validate(dto);

    assert.ok(errors.length > 0);
  });
});
