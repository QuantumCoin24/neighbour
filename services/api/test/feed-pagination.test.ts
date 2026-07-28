import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCursorPagination, extractPage } from '../src/post/utils/feed-pagination.util';

describe('feed cursor pagination', () => {
  it('requests one extra record to detect another page', () => {
    assert.deepEqual(createCursorPagination({ limit: 20 }), {
      take: 21,
    });
  });

  it('uses a cursor and skips the cursor record', () => {
    assert.deepEqual(
      createCursorPagination({
        cursor: '11111111-1111-4111-8111-111111111111',
        limit: 10,
      }),
      {
        take: 11,
        skip: 1,
        cursor: {
          id: '11111111-1111-4111-8111-111111111111',
        },
      },
    );
  });

  it('limits page size to fifty records', () => {
    assert.deepEqual(createCursorPagination({ limit: 100 }), {
      take: 51,
    });
  });

  it('returns a next cursor when another page exists', () => {
    const result = extractPage([{ id: 'post-1' }, { id: 'post-2' }, { id: 'post-3' }], 2);

    assert.deepEqual(result, {
      items: [{ id: 'post-1' }, { id: 'post-2' }],
      nextCursor: 'post-2',
    });
  });

  it('returns no cursor on the final page', () => {
    const result = extractPage([{ id: 'post-1' }, { id: 'post-2' }], 2);

    assert.equal(result.nextCursor, null);
  });
});
