import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';
import { DatabaseService } from '../../../database/database.service';
import { SubscriptionService } from '../../../payments/subscription/subscription.service';
import { OfferService } from './offer.service';

@Controller('businesses')
export class OfferController {
  constructor(
    private readonly service: OfferService,
    private readonly database: DatabaseService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  @Post(':businessId/offers')
  async create(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body()
    body: {
      title: string;
      description: string;
      active?: boolean;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
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
      throw new ForbiddenException('Only the business owner may create offers.');
    }

    if (
      (body.startsAt || body.endsAt) &&
      !(await this.subscriptions.hasEntitlement(user.id, 'scheduledOffers'))
    ) {
      throw new ForbiddenException('Scheduled offers require Neighbour Business.');
    }

    return this.service.create({
      businessId,
      title: body.title,
      description: body.description,
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.startsAt ? { startsAt: new Date(body.startsAt) } : {}),
      ...(body.endsAt ? { endsAt: new Date(body.endsAt) } : {}),
    });
  }

  @Get('offers/discover')
  discoverOffers() {
    return this.service.findActive();
  }

  @Get(':businessId/offers')
  findBusinessOffers(@Param('businessId') businessId: string) {
    return this.service.findByBusiness(businessId);
  }

  @Get('offers/:id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
