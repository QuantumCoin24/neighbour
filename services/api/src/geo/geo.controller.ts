import { Controller, Get, Query } from '@nestjs/common';

import { NearbyQueryDto } from './dto/nearby-query.dto';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('nearby')
  findNearby(@Query() query: NearbyQueryDto) {
    return this.geoService.findNearby(query);
  }
}
