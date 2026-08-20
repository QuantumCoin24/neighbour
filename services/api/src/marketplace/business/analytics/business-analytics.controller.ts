import { Controller, ForbiddenException, Get, NotFoundException, Param } from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';
import { DatabaseService } from '../../../database/database.service';
import { SubscriptionService } from '../../../payments/subscription/subscription.service';
import { BusinessAnalyticsService } from './business-analytics.service';

@Controller('businesses')
export class BusinessAnalyticsController {
  constructor(
    private readonly service: BusinessAnalyticsService,
    private readonly database: DatabaseService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  @Get(':businessId/analytics')
  async getAnalytics(@CurrentUser() user: AuthUser, @Param('businessId') businessId: string) {
    const business = await this.database.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        ownerId: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    if (business.ownerId !== user.id) {
      throw new ForbiddenException('Business analytics are private to the business owner.');
    }

    if (!(await this.subscriptions.hasEntitlement(user.id, 'businessAnalytics'))) {
      throw new ForbiddenException('Business analytics require Neighbour Business.');
    }

    return this.service.getAnalytics(businessId);
  }
}
