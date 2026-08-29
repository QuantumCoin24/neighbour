import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdventureController } from './adventure.controller';
import { AdventureRepository } from './adventure.repository';
import { AdventureService } from './adventure.service';
import { PrismaAdventureRepository } from './prisma-adventure.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [AdventureController],
  providers: [
    AdventureService,
    {
      provide: AdventureRepository,
      useClass: PrismaAdventureRepository,
    },
  ],
  exports: [AdventureService],
})
export class AdventureModule {}
