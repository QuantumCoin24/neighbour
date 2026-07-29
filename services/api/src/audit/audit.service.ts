import { Injectable } from '@nestjs/common';

import type { AuditEntity } from './audit.entity';

@Injectable()
export class AuditService {
  private records: AuditEntity[] = [];

  record(audit: AuditEntity): AuditEntity {
    this.records.push(audit);

    return audit;
  }

  list(): AuditEntity[] {
    return this.records;
  }
}
