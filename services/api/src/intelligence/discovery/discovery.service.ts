import { Injectable } from '@nestjs/common';

import type { DiscoveryEntity } from './discovery.entity';

@Injectable()
export class DiscoveryService {
  private discoveries: DiscoveryEntity[] = [];

  record(discovery: DiscoveryEntity): DiscoveryEntity {
    this.discoveries.push(discovery);

    return discovery;
  }

  findForUser(userId: string): DiscoveryEntity[] {
    return this.discoveries.filter((item) => item.userId === userId);
  }
}
