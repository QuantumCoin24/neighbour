import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../../database/database.module';

import { BusinessEventController } from './event.controller';
import { BusinessEventService } from './event.service';

import { BusinessEventRepository } from './event.repository';
import { PrismaBusinessEventRepository } from './prisma-event.repository';

@Module({
  imports: [DatabaseModule],

  controllers: [BusinessEventController],

  providers: [
    BusinessEventService,

    {
      provide: BusinessEventRepository,
      useClass: PrismaBusinessEventRepository,
    },
  ],

  exports: [BusinessEventService],
})
export class BusinessEventModule {}
