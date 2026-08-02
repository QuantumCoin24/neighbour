import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { SecurityEventBusService } from '../events/security-event-bus.service';

import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports:[
    DatabaseModule,
  ],
  controllers:[
    ReportController,
  ],
  providers:[
    ReportService,
    SecurityEventBusService,
  ],
  exports:[
    ReportService,
  ],
})
export class ReportModule {}
