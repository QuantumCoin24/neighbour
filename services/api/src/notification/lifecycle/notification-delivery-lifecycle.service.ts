import { Injectable } from '@nestjs/common';

export type NotificationDeliveryState = 'queued' | 'sending' | 'delivered' | 'failed';

@Injectable()
export class NotificationDeliveryLifecycleService {
  private readonly states = new Map<string, NotificationDeliveryState>();

  set(id: string, state: NotificationDeliveryState): void {
    this.states.set(id, state);
  }

  get(id: string): NotificationDeliveryState | undefined {
    return this.states.get(id);
  }

  clear(id: string): void {
    this.states.delete(id);
  }

  reset(): void {
    this.states.clear();
  }
}
