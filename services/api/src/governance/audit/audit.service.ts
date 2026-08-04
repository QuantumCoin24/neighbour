import { Injectable } from '@nestjs/common';

import type { AuditEventEntity } from './audit-event.entity';

@Injectable()
export class AuditService {
  private events: AuditEventEntity[] = [];

  record(event: AuditEventEntity): AuditEventEntity {
    this.events.push(event);

    return event;
  }

  list(): AuditEventEntity[] {
    return this.events;
  }
}
