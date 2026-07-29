import { Injectable } from '@nestjs/common';

import type { LocationEntity } from './location.entity';

@Injectable()
export class LocationService {
  private locations: LocationEntity[] = [];

  save(location: LocationEntity): LocationEntity {
    this.locations.push(location);

    return location;
  }

  findByArea(area: string): LocationEntity[] {
    return this.locations.filter((item) => item.area === area);
  }
}
