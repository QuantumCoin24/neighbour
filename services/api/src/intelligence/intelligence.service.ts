import { Injectable } from '@nestjs/common';

import { IntelligenceEventBusService } from './events/intelligence-event-bus.service';

import { DiscoveryService } from './discovery/discovery.service';

import { RecommendationService } from './recommendation/recommendation.service';

import { PreferenceService } from './personalisation/preference.service';

@Injectable()
export class IntelligenceService {
  constructor(
    private readonly eventBus: IntelligenceEventBusService,
    private readonly discovery: DiscoveryService,
    private readonly recommendations: RecommendationService,
    private readonly preferences: PreferenceService,
  ) {
    this.eventBus.subscribe((event) => this.handle(event));
  }

  handle(event: any) {
    switch (event.type) {
      case 'recommendation.generated':
        return this.recommendations.findForUser(event.userId);

      case 'preference.changed':
        return this.preferences.findForUser(event.userId);

      default:
        return null;
    }
  }

  getUserIntelligence(userId: string) {
    return {
      discoveries: this.discovery.findForUser(userId),

      recommendations: this.recommendations.rank(this.recommendations.findForUser(userId)),

      preferences: this.preferences.findForUser(userId),
    };
  }
}
