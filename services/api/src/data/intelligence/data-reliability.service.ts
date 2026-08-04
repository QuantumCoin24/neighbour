import { Injectable } from '@nestjs/common';

import { DataIntegrityService } from '../integrity/data-integrity.service';
import { DataRecoveryService } from '../recovery/data-recovery.service';

@Injectable()
export class DataReliabilityService {
  constructor(
    private readonly integrity: DataIntegrityService,

    private readonly recovery: DataRecoveryService,
  ) {}

  analyse(recordCount: number) {
    const integrity = this.integrity.check(recordCount);

    const recovery = this.recovery.createRecoveryPoint('latest');

    return {
      status: integrity.valid ? 'RELIABLE' : 'REVIEW_REQUIRED',

      integrity,

      recovery,

      analysedAt: new Date(),
    };
  }
}
