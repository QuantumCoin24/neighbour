import { Module } from '@nestjs/common';

import { NeighbourhoodService } from './neighbourhood.service';
import { MembershipService } from './membership/membership.service';
import { NeighbourhoodController } from './neighbourhood.controller';

@Module({
  controllers: [NeighbourhoodController],
  providers: [NeighbourhoodService, MembershipService, NeighbourhoodController],
  exports: [NeighbourhoodService, MembershipService, NeighbourhoodController],
})
export class NeighbourhoodModule {}
