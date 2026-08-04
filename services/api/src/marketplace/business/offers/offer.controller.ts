import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { OfferService } from './offer.service';

@Controller('businesses')
export class OfferController {
  constructor(private readonly service: OfferService) {}

  @Post(':businessId/offers')
  create(
    @Param('businessId')
    businessId: string,

    @Body()
    body: {
      title: string;
      description: string;
      active?: boolean;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    return this.service.create({
      businessId,

      title: body.title,

      description: body.description,

      ...(body.active !== undefined ? { active: body.active } : {}),

      ...(body.startsAt ? { startsAt: new Date(body.startsAt) } : {}),

      ...(body.endsAt ? { endsAt: new Date(body.endsAt) } : {}),
    });
  }

  @Get(':businessId/offers')
  findBusinessOffers(
    @Param('businessId')
    businessId: string,
  ) {
    return this.service.findByBusiness(businessId);
  }

  @Get('/offers/:id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.service.findById(id);
  }
}
