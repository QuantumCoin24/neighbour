import { Controller, Get, Query } from '@nestjs/common';

import { NearbyQueryDto } from '../dto/nearby-query.dto';
import { NearbyService } from '../services/nearby.service';

@Controller('nearby')
export class NearbyController {
  constructor(private readonly nearby: NearbyService) {}

  @Get('health')
  health() {
    return this.nearby.health();
  }

  @Get('radius-presets')
  radiusPresets() {
    return this.nearby.radiusPresets();
  }

  @Get()
  discover(
    @Query()
    query: NearbyQueryDto,
  ) {
    return this.nearby.discover(query);
  }
}
