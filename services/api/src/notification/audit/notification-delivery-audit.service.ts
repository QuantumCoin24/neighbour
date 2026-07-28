import { Injectable } from '@nestjs/common';

export interface NotificationAuditEntry {
  id: string;
  event: string;
  timestamp: Date;
}

@Injectable()
export class NotificationDeliveryAuditService {
  private readonly entries: NotificationAuditEntry[] = [];

  record(id: string, event: string): void {
    this.entries.push({
      id,
      event,
      timestamp: new Date(),
    });
  }

  list(): NotificationAuditEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries.length = 0;
  }
}
