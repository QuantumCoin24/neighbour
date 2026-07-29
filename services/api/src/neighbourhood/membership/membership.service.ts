import { Injectable } from '@nestjs/common';

import type { MembershipEntity } from './membership.entity';

import { MembershipRepository } from './membership.repository';

@Injectable()
export class MembershipService {
  constructor(private readonly repository: MembershipRepository) {}

  join(membership: MembershipEntity): Promise<MembershipEntity> {
    return this.repository.save(membership);
  }

  leave(userId: string, neighbourhoodId: string): Promise<void> {
    return this.repository.remove(userId, neighbourhoodId);
  }

  findUserMemberships(userId: string): Promise<MembershipEntity[]> {
    return this.repository.findByUser(userId);
  }

  findMembers(neighbourhoodId: string): Promise<MembershipEntity[]> {
    return this.repository.findMembers(neighbourhoodId);
  }
}
