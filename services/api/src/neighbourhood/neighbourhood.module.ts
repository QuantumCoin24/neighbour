import { Module } from '@nestjs/common';

import { NeighbourhoodService } from './neighbourhood.service';
import { NeighbourhoodController } from './neighbourhood.controller';

import { MembershipService } from './membership/membership.service';
import { MembershipController } from './membership/membership.controller';

import { NeighbourhoodRepository } from './neighbourhood.repository';
import { PrismaNeighbourhoodRepository } from './repository/prisma-neighbourhood.repository';

import { MembershipRepository } from './membership/membership.repository';
import { PrismaMembershipRepository } from './membership/repository/prisma-membership.repository';

@Module({
  controllers: [
    NeighbourhoodController,
    MembershipController,
  ],

  providers: [
    NeighbourhoodService,
    MembershipService,

    {
      provide: NeighbourhoodRepository,
      useClass: PrismaNeighbourhoodRepository,
    },

    {
      provide: MembershipRepository,
      useClass: PrismaMembershipRepository,
    },
  ],

  exports: [
    NeighbourhoodService,
    MembershipService,
  ],
})
export class NeighbourhoodModule {}
