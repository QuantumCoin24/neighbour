import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PrismaTrailRepository } from './prisma-trail.repository';
import { TrailController } from './trail.controller';
import { TrailRepository } from './trail.repository';
import { TrailService } from './trail.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TrailController],
  providers: [
    TrailService,
    {
      provide: TrailRepository,
      useClass: PrismaTrailRepository,
    },
  ],
  exports: [TrailService],
})
export class TrailModule {}
