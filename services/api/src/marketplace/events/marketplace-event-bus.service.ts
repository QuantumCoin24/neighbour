import { Injectable } from '@nestjs/common';

export type MarketplaceEvent =
  | {
      type: 'business.created';
      businessId: string;
    }
  | {
      type: 'recommendation.created';
      recommendationId: string;
    };

@Injectable()
export class MarketplaceEventBusService {
  private listeners: ((event: MarketplaceEvent) => void)[] = [];

  subscribe(listener: (event: MarketplaceEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: MarketplaceEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
