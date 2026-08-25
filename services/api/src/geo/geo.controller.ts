import { Controller, Get, Query } from '@nestjs/common';

import { NearbyQueryDto } from './dto/nearby-query.dto';
import { PostalResolveQueryDto } from './dto/postal-resolve-query.dto';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('nearby')
  findNearby(@Query() query: NearbyQueryDto) {
    return this.geoService.findNearby(query);
  }

  @Get('postal/resolve')
  resolvePostalLocation(@Query() query: PostalResolveQueryDto) {
    return this.geoService.resolvePostalLocation(query.countryCode, query.postalCode);
  }
}
