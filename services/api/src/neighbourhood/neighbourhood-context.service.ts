import { Injectable } from '@nestjs/common';

import { MembershipRepository } from './membership/membership.repository';

@Injectable()
export class NeighbourhoodContextService {
  constructor(private readonly repository: MembershipRepository) {}

  getUserNeighbourhoods(userId: string) {
    return this.repository.findByUser(userId);
  }
}
