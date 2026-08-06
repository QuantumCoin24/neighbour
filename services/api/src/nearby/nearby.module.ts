import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { NearbyController } from './controllers/nearby.controller';
import { NearbyDistanceService } from './services/distance.service';
import { NearbyService } from './services/nearby.service';
import { NearbyRadiusService } from './services/radius.service';
import { NearbyRankingService } from './services/ranking.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NearbyController],
  providers: [NearbyDistanceService, NearbyRadiusService, NearbyRankingService, NearbyService],
  exports: [NearbyDistanceService, NearbyRadiusService, NearbyRankingService, NearbyService],
})
export class NearbyModule {}
