import { Injectable } from '@nestjs/common';

import { BusinessService } from '../business.service';
import { VerificationService } from '../verification/verification.service';
import { OfferService } from '../offers/offer.service';
import { BusinessEventService } from '../events/event.service';

@Injectable()
export class BusinessDashboardService {
  constructor(
    private readonly businessService: BusinessService,

    private readonly verificationService: VerificationService,

    private readonly offerService: OfferService,

    private readonly eventService: BusinessEventService,
  ) {}

  async getDashboard(businessId: string) {
    const business = await this.businessService.findById(businessId);

    const verification = await this.verificationService.findByBusiness(businessId);

    const offers = await this.offerService.findByBusiness(businessId);

    const events = await this.eventService.findByBusiness(businessId);

    return {
      business,

      verification,

      offers,

      events,
    };
  }
}
