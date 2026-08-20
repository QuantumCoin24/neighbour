import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { SubscriptionService } from '../payments/subscription/subscription.service';
import { SearchIntelligenceService } from './intelligence/search-intelligence.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly database: DatabaseService,
    private readonly intelligence: SearchIntelligenceService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  async search(query: string, limit = 10) {
    const term = query.trim();

    if (!term) {
      return {
        users: [],
        communities: [],
        neighbourhoods: [],
        events: [],
        posts: [],
      };
    }

    const contains = {
      contains: term,
      mode: 'insensitive' as const,
    };

    const [users, communities, neighbourhoods, events, posts] = await Promise.all([
      this.database.user.findMany({
        where: {
          OR: [
            {
              displayName: contains,
            },
            {
              email: contains,
            },
            {
              profile: {
                username: contains,
              },
            },
          ],
        },
        select: {
          id: true,
          displayName: true,
        },
        take: limit,
      }),

      this.database.community.findMany({
        where: {
          OR: [
            {
              name: contains,
            },
            {
              description: contains,
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        take: limit,
      }),

      this.database.neighbourhood.findMany({
        where: {
          OR: [
            {
              name: contains,
            },
            {
              localArea: contains,
            },
          ],
        },
        select: {
          id: true,
          name: true,
          localArea: true,
        },
        take: limit,
      }),

      this.database.event.findMany({
        where: {
          OR: [
            {
              title: contains,
            },
            {
              description: contains,
            },
          ],
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          community: {
            select: {
              name: true,
            },
          },
        },
        take: limit,
      }),

      this.database.post.findMany({
        where: {
          OR: [
            {
              title: contains,
            },
            {
              content: contains,
            },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
        },
        take: limit,
      }),
    ]);

    const rankedCommunities = this.intelligence.rank(communities, (item) =>
      this.intelligence.scoreText(item.name, term),
    );

    if (rankedCommunities.length > 0) {
      const owners = await this.database.membership.findMany({
        where: {
          communityId: {
            in: rankedCommunities.map((community) => community.id),
          },
          role: 'OWNER',
          status: 'ACTIVE',
        },
        select: {
          communityId: true,
          userId: true,
        },
      });

      const boostedCommunityIds = new Set<string>();

      for (const owner of owners) {
        if (await this.subscriptions.hasEntitlement(owner.userId, 'communityBoosts')) {
          boostedCommunityIds.add(owner.communityId);
        }
      }

      rankedCommunities.sort(
        (left, right) =>
          Number(boostedCommunityIds.has(right.id)) - Number(boostedCommunityIds.has(left.id)),
      );
    }

    return {
      users: this.intelligence.rank(users, (item) =>
        this.intelligence.scoreText(item.displayName, term),
      ),

      communities: rankedCommunities,

      neighbourhoods: this.intelligence.rank(neighbourhoods, (item) =>
        this.intelligence.scoreText(item.name, term),
      ),

      events: this.intelligence.rank(events, (item) =>
        this.intelligence.scoreText(item.title, term),
      ),

      posts: this.intelligence.rank(posts, (item) =>
        this.intelligence.scoreText(item.title ?? item.content, term),
      ),
    };
  }
}
