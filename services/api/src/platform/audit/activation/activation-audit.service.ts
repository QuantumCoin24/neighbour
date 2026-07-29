import { Injectable } from '@nestjs/common';

import type { ActivationRecordEntity } from './activation-record.entity';


@Injectable()
export class ActivationAuditService {

  analyse(
    record: ActivationRecordEntity,
  ) {

    let status = 'FOUNDATION';


    if (
      record.service &&
      record.module &&
      record.controller &&
      record.database
    ) {

      status = 'ACTIVE';

    }


    return {

      ...record,

      status,

      auditedAt: new Date(),

    };

  }


}
