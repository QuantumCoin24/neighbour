import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileEventBusService } from './profile-event-bus.service';
import { PrismaProfileRepository } from './prisma-profile.repository';
import { ProfileRepository } from './profile.repository';
@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [
    ProfileController,
  ],
  providers: [
  ProfileService,
  ProfileEventBusService,
  {
    provide: ProfileRepository,
    useClass: PrismaProfileRepository,
  },
],
  exports: [
    ProfileService,
  ],
})
export class ProfileModule {}
