import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';
import { EventRepository } from './event/event.repository';
import { PrismaEventRepository } from './event/prisma-event.repository';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { AttendanceRepository } from './attendance/attendance.repository';
import { PrismaAttendanceRepository } from './attendance/prisma-attendance.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [
    CommunityController,
    EventController,
    AttendanceController
  ],
  providers: [
    CommunityService,
    EventService,
    {
      provide: EventRepository,
      useClass: PrismaEventRepository,
    },
  AttendanceService,
  {
    provide: AttendanceRepository,
    useClass: PrismaAttendanceRepository,
  }
  ],
  exports: [
    CommunityService,
    EventService,
  ],
})
export class CommunityModule {}
