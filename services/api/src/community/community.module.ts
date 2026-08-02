import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';
import { EventRepository } from './event/event.repository';
import { PrismaEventRepository } from './event/prisma-event.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [
    CommunityController,
    EventController,
  ],
  providers: [
    CommunityService,
    EventService,
    {
      provide: EventRepository,
      useClass: PrismaEventRepository,
    },
  ],
  exports: [
    CommunityService,
    EventService,
  ],
})
export class CommunityModule {}
