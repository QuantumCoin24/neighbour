import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceRepository } from './attendance/attendance.repository';
import { AttendanceService } from './attendance/attendance.service';
import { PrismaAttendanceRepository } from './attendance/prisma-attendance.repository';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityFeedEventBusService } from './events/community-feed-event-bus.service';
import { EventController } from './event/event.controller';
import { EventRepository } from './event/event.repository';
import { EventService } from './event/event.service';
import { PrismaEventRepository } from './event/prisma-event.repository';
import { CommunityInsightListenerService } from './intelligence/community-insight-listener.service';
import { CommunityInsightService } from './intelligence/community-insight.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CommunityController, EventController, AttendanceController],
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
    },
    CommunityFeedEventBusService,
    CommunityInsightService,
    CommunityInsightListenerService,
  ],
  exports: [CommunityService, EventService, CommunityFeedEventBusService],
})
export class CommunityModule {}
