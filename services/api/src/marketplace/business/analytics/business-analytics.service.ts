import { Injectable } from '@nestjs/common';

import { AnalyticsService } from '../../../analytics/analytics.service';

@Injectable()
export class BusinessAnalyticsService {
  constructor(private readonly analytics: AnalyticsService) {}

  recordBusinessView(businessId: string, userId?: string) {
    return this.analytics.record({
      id: crypto.randomUUID(),

      type: 'BUSINESS_VIEW',

      subjectId: businessId,

      metadata: {
        userId,
      },

      createdAt: new Date(),
    });
  }

  recordOfferView(offerId: string, businessId: string, userId?: string) {
    return this.analytics.record({
      id: crypto.randomUUID(),

      type: 'OFFER_VIEW',

      subjectId: offerId,

      metadata: {
        businessId,
        userId,
      },

      createdAt: new Date(),
    });
  }

  recordEventView(eventId: string, businessId: string, userId?: string) {
    return this.analytics.record({
      id: crypto.randomUUID(),

      type: 'EVENT_VIEW',

      subjectId: eventId,

      metadata: {
        businessId,
        userId,
      },

      createdAt: new Date(),
    });
  }

  getAnalytics(businessId: string) {
    const events = this.analytics.list();

    const profileViews = events.filter(
      (event) => event.type === 'BUSINESS_VIEW' && event.subjectId === businessId,
    ).length;

    const offerViews = events.filter(
      (event) => event.type === 'OFFER_VIEW' && event.metadata?.businessId === businessId,
    ).length;

    const eventViews = events.filter(
      (event) => event.type === 'EVENT_VIEW' && event.metadata?.businessId === businessId,
    ).length;

    return {
      businessId,

      profileViews,

      offerViews,

      eventViews,

      totalReach: profileViews + offerViews + eventViews,
    };
  }
}
