import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DatabaseService } from '../../src/database/database.service';
import { SearchIntelligenceService } from '../../src/search/intelligence/search-intelligence.service';
import { SearchService } from '../../src/search/search.service';

interface FakeDatabase {
  user: {
    findMany(): Promise<Array<{ id: string; displayName: string }>>;
  };
  community: {
    findMany(): Promise<Array<{ id: string; name: string; slug: string }>>;
  };
  neighbourhood: {
    findMany(): Promise<Array<{ id: string; name: string; localArea: string | null }>>;
  };
  event: {
    findMany(): Promise<
      Array<{
        id: string;
        title: string;
        startsAt: Date;
        community: { name: string };
      }>
    >;
  };
  post: {
    findMany(): Promise<Array<{ id: string; title: string | null; content: string }>>;
  };
}

describe('SearchService', () => {
  it('finds and ranks matching results', async () => {
    const database: FakeDatabase = {
      user: {
        async findMany() {
          return [];
        },
      },
      community: {
        async findMany() {
          return [
            {
              id: 'community-2',
              name: 'North Manchester',
              slug: 'north-manchester',
            },
            {
              id: 'community-1',
              name: 'Blackley Community',
              slug: 'blackley-community',
            },
          ];
        },
      },
      neighbourhood: {
        async findMany() {
          return [];
        },
      },
      event: {
        async findMany() {
          return [];
        },
      },
      post: {
        async findMany() {
          return [];
        },
      },
    };

    const service = new SearchService(
      database as unknown as DatabaseService,
      new SearchIntelligenceService(),
    );

    const result = await service.search('Blackley');

    assert.equal(result.communities[0]?.id, 'community-1');
    assert.equal(result.communities[0]?.name, 'Blackley Community');
  });

  it('returns empty result groups for a blank query', async () => {
    const database = {} as unknown as DatabaseService;

    const service = new SearchService(database, new SearchIntelligenceService());

    const result = await service.search('   ');

    assert.deepEqual(result, {
      users: [],
      communities: [],
      neighbourhoods: [],
      events: [],
      posts: [],
    });
  });
});
