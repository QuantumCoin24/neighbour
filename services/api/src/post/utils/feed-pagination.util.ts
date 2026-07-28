export interface PaginationInput {
  cursor?: string;
  limit?: number;
}

export interface PrismaCursorPagination {
  take: number;
  skip?: number;
  cursor?: {
    id: string;
  };
}

export function createCursorPagination(input: PaginationInput): PrismaCursorPagination {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);

  if (!input.cursor) {
    return {
      take: limit + 1,
    };
  }

  return {
    take: limit + 1,
    skip: 1,
    cursor: {
      id: input.cursor,
    },
  };
}

export function extractPage<T extends { id: string }>(
  records: T[],
  limit = 20,
): {
  items: T[];
  nextCursor: string | null;
} {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const hasNextPage = records.length > safeLimit;
  const items = hasNextPage ? records.slice(0, safeLimit) : records;

  return {
    items,
    nextCursor: hasNextPage && items.length > 0 ? (items[items.length - 1]?.id ?? null) : null,
  };
}
