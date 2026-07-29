import { Injectable } from '@nestjs/common';

import type { SearchEntity } from './search.entity';

@Injectable()
export class SearchService {
  private results: SearchEntity[] = [];

  index(item: SearchEntity): SearchEntity {
    this.results.push(item);

    return item;
  }

  search(query: string): SearchEntity[] {
    return this.results.filter((item) => item.query.toLowerCase().includes(query.toLowerCase()));
  }
}
