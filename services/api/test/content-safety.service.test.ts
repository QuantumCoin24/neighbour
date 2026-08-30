import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';

import { ContentSafetyService } from '../src/common/content-safety/content-safety.service';

function rejection(
  service: ContentSafetyService,
  value: string,
  field = 'content',
): {
  statusCode?: number;
  error?: string;
  message?: string;
  field?: string;
  reason?: string;
} {
  try {
    service.assertAcceptable({
      field,
      value,
    });
  } catch (error) {
    assert.ok(
      error instanceof BadRequestException,
      'Expected BadRequestException',
    );

    const response = error.getResponse();

    assert.equal(
      typeof response,
      'object',
      'Expected structured rejection response',
    );

    return response as {
      statusCode?: number;
      error?: string;
      message?: string;
      field?: string;
      reason?: string;
    };
  }

  assert.fail('Expected content to be rejected');
}

describe('ContentSafetyService', () => {
  const service = new ContentSafetyService();

  it('allows ordinary community content', () => {
    assert.doesNotThrow(() => {
      service.assertAcceptable(
        {
          field: 'title',
          value: 'Community garden volunteers needed',
        },
        {
          field: 'content',
          value:
            'We are meeting at the community centre on Saturday morning.',
        },
      );
    });
  });

  it('allows legitimate discussion containing harm-related words', () => {
    assert.doesNotThrow(() => {
      service.assertAcceptable({
        field: 'content',
        value:
          'The news report discussed an attempted attack and a murder investigation.',
      });
    });
  });

  it('allows non-threatening use of the word kill', () => {
    assert.doesNotThrow(() => {
      service.assertAcceptable({
        field: 'content',
        value:
          'The cold weather can kill some garden plants, so cover them tonight.',
      });
    });
  });

  it('ignores null, undefined and empty values', () => {
    assert.doesNotThrow(() => {
      service.assertAcceptable(
        {
          field: 'one',
          value: null,
        },
        {
          field: 'two',
          value: undefined,
        },
        {
          field: 'three',
          value: '   ',
        },
      );
    });
  });

  it('rejects a targeted death threat', () => {
    const response = rejection(
      service,
      'I will kill you',
      'message',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.error, 'CONTENT_REJECTED');
    assert.equal(response.field, 'message');
    assert.equal(response.reason, 'TARGETED_DEATH_THREAT');
    assert.equal(
      response.message,
      'This content cannot be published because it may violate the Neighbour Community Guidelines.',
    );
  });

  it('rejects a targeted rape threat', () => {
    const response = rejection(
      service,
      'I will rape you',
      'message',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.error, 'CONTENT_REJECTED');
    assert.equal(response.field, 'message');
    assert.equal(response.reason, 'TARGETED_RAPE_THREAT');
  });

  it('rejects encouragement of self-harm', () => {
    const response = rejection(
      service,
      'go kill yourself',
      'comment',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.error, 'CONTENT_REJECTED');
    assert.equal(response.field, 'comment');
    assert.equal(response.reason, 'SELF_HARM_ENCOURAGEMENT');
  });

  it('rejects child sexual solicitation', () => {
    const response = rejection(
      service,
      'looking for child nude photos',
      'content',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.error, 'CONTENT_REJECTED');
    assert.equal(response.reason, 'CHILD_SEXUAL_SOLICITATION');
  });

  it('rejects solicitation of child sexual material', () => {
    const response = rejection(
      service,
      'child porn',
      'content',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.error, 'CONTENT_REJECTED');
    assert.equal(
      response.reason,
      'CHILD_SEXUAL_MATERIAL_SOLICITATION',
    );
  });

  it('rejects explicitly targeted violent instruction', () => {
    const response = rejection(
      service,
      'someone should shoot him',
      'content',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.error, 'CONTENT_REJECTED');
    assert.equal(
      response.reason,
      'TARGETED_VIOLENT_INSTRUCTION',
    );
  });

  it('normalises zero-width characters before matching', () => {
    const response = rejection(
      service,
      'I will ki\u200Bll you',
      'message',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.reason, 'TARGETED_DEATH_THREAT');
  });

  it('normalises NFKC-compatible characters before matching', () => {
    const response = rejection(
      service,
      'Ｉ　ｗｉｌｌ　ｋｉｌｌ　ｙｏｕ',
      'message',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.reason, 'TARGETED_DEATH_THREAT');
  });

  it('collapses whitespace before matching', () => {
    const response = rejection(
      service,
      'I   will\n\tkill   you',
      'message',
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.reason, 'TARGETED_DEATH_THREAT');
  });

  it('reports the specific field containing rejected content', () => {
    try {
      service.assertAcceptable(
        {
          field: 'title',
          value: 'Normal title',
        },
        {
          field: 'description',
          value: 'I will murder them',
        },
      );

      assert.fail('Expected content to be rejected');
    } catch (error) {
      assert.ok(error instanceof BadRequestException);

      const response = error.getResponse() as {
        field?: string;
        reason?: string;
      };

      assert.equal(response.field, 'description');
      assert.equal(response.reason, 'TARGETED_DEATH_THREAT');
    }
  });
});
