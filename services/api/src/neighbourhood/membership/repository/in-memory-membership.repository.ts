import { Injectable } from '@nestjs/common';

import type { MembershipEntity } from '../membership.entity';
import { MembershipRepository } from '../membership.repository';

@Injectable()
export class InMemoryMembershipRepository
  implements MembershipRepository
{
  private memberships: MembershipEntity[] = [];

  async save(
    membership: MembershipEntity,
  ): Promise<MembershipEntity> {

    const existing = this.memberships.find(
      (item) =>
        item.userId === membership.userId &&
        item.neighbourhoodId === membership.neighbourhoodId,
    );

    if (existing) {
      return existing;
    }

    this.memberships.push(membership);

    return membership;
  }

  async remove(
    userId: string,
    neighbourhoodId: string,
  ): Promise<void> {
    this.memberships =
      this.memberships.filter(
        (item) =>
          !(
            item.userId === userId &&
            item.neighbourhoodId === neighbourhoodId
          ),
      );
  }

  async findByUser(
    userId: string,
  ): Promise<MembershipEntity[]> {
    return this.memberships.filter(
      (item) => item.userId === userId,
    );
  }

  async findMembers(
    neighbourhoodId: string,
  ): Promise<MembershipEntity[]> {
    return this.memberships.filter(
      (item) =>
        item.neighbourhoodId === neighbourhoodId,
    );
  }
}
