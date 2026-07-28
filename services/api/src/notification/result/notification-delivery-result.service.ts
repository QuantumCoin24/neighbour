import { Injectable } from '@nestjs/common';

export interface NotificationDeliveryResult {
  id: string;
  success: boolean;
  timestamp: Date;
  reason?: string;
}

@Injectable()
export class NotificationDeliveryResultService {
  private readonly results = new Map<string, NotificationDeliveryResult>();

  record(result: NotificationDeliveryResult): void {
    this.results.set(result.id, result);
  }

  get(id: string): NotificationDeliveryResult | undefined {
    return this.results.get(id);
  }

  clear(id: string): void {
    this.results.delete(id);
  }

  reset(): void {
    this.results.clear();
  }
}
