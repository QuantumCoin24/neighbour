import { Module } from '@nestjs/common';

import { DataIntegrityService } from './integrity/data-integrity.service';
import { DataRecoveryService } from './recovery/data-recovery.service';
import { DataReliabilityService } from './intelligence/data-reliability.service';

@Module({
  providers: [DataIntegrityService, DataRecoveryService, DataReliabilityService],

  exports: [DataReliabilityService],
})
export class DataModule {}
