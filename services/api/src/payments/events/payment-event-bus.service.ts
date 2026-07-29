import { Injectable } from '@nestjs/common';

export type PaymentEvent =
  | {
      type: 'payment.completed';
      transactionId: string;
    }
  | {
      type: 'subscription.started';
      subscriptionId: string;
    }
  | {
      type: 'subscription.cancelled';
      subscriptionId: string;
    };

@Injectable()
export class PaymentEventBusService {
  private listeners: ((event: PaymentEvent) => void)[] = [];

  subscribe(listener: (event: PaymentEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: PaymentEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
