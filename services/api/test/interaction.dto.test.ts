import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CommentQueryDto } from '../src/interaction/dto/comment-query.dto';
import { CreateCommentDto } from '../src/interaction/dto/create-comment.dto';
import { SetReactionDto } from '../src/interaction/dto/set-reaction.dto';

describe('Build 0009 interaction DTO validation', () => {
  it('accepts a valid comment', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'Welcome to the neighbourhood.',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
  });

  it('rejects an empty comment', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: '',
    });

    const errors = await validate(dto);

    assert.ok(errors.length > 0);
  });

  it('accepts a supported reaction', async () => {
    const dto = plainToInstance(SetReactionDto, {
      type: 'SUPPORT',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
  });

  it('normalises the comment feed limit from a query string', async () => {
    const dto = plainToInstance(CommentQueryDto, {
      limit: '25',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.limit, 25);
  });
});
