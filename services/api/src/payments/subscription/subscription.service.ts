import { Injectable } from '@nestjs/common';

import type { SubscriptionEntity } from './subscription.entity';

@Injectable()
export class SubscriptionService {
  private subscriptions: SubscriptionEntity[] = [];

  create(subscription: SubscriptionEntity): SubscriptionEntity {
    this.subscriptions.push(subscription);

    return subscription;
  }

  findByOwner(ownerId: string): SubscriptionEntity[] {
    return this.subscriptions.filter((item) => item.ownerId === ownerId);
  }
}
