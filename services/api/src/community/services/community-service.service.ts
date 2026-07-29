import { Injectable } from '@nestjs/common';

import type { CommunityServiceEntity } from './community-service.entity';

@Injectable()
export class CommunityServiceService {
  private services: CommunityServiceEntity[] = [];

  create(service: CommunityServiceEntity): CommunityServiceEntity {
    this.services.push(service);

    return service;
  }

  list(communityId: string): CommunityServiceEntity[] {
    return this.services.filter((service) => service.communityId === communityId);
  }
}
