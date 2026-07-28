import { Injectable } from '@nestjs/common';

export interface NotificationDeliveryHealth {
  healthy: boolean;
  lastFailure?: Date;
}

@Injectable()
export class NotificationDeliveryHealthService {
  private state: NotificationDeliveryHealth = {
    healthy: true,
  };

  markHealthy(): void {
    this.state = {
      healthy: true,
    };
  }

  markFailure(): void {
    this.state = {
      healthy: false,
      lastFailure: new Date(),
    };
  }

  status(): NotificationDeliveryHealth {
    return { ...this.state };
  }
}
