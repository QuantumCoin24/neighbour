import { Injectable } from '@nestjs/common';

import { MembershipRepository } from './membership/membership.repository';

@Injectable()
export class NeighbourhoodContextService {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  getUserNeighbourhoods(userId: string) {
    return this.membershipRepository.findByUser(userId);
  }
}
