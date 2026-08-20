import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { SubscriptionService } from '../payments/subscription/subscription.service';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly service: SearchService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  @Get()
  async search(@CurrentUser() user: AuthUser, @Query('q') query: string) {
    if (!query) {
      return [];
    }

    const limit = await this.subscriptions.getSearchResultLimit(user.id);

    return this.service.search(query, limit);
  }
}
