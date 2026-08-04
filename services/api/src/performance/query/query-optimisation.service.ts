import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryOptimisationService {
  optimise(query: string) {
    return {
      query,

      optimised: true,

      analysedAt: new Date(),
    };
  }

  paginate(items: unknown[], limit: number, page: number) {
    const start = (page - 1) * limit;

    return {
      items: items.slice(start, start + limit),

      page,

      limit,

      total: items.length,
    };
  }
}
