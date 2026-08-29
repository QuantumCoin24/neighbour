import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { MapDiscoveryController } from './map-discovery.controller';
import { MapDiscoveryRepository } from './map-discovery.repository';
import { MapDiscoveryService } from './map-discovery.service';
import { PrismaMapDiscoveryRepository } from './prisma-map-discovery.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [MapDiscoveryController],
  providers: [
    MapDiscoveryService,
    {
      provide: MapDiscoveryRepository,
      useClass: PrismaMapDiscoveryRepository,
    },
  ],
  exports: [MapDiscoveryService],
})
export class MapDiscoveryModule {}
