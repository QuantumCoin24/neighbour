import type { MembershipEntity } from './membership.entity';

export abstract class MembershipRepository {
  abstract save(membership: MembershipEntity): Promise<MembershipEntity>;

  abstract remove(userId: string, neighbourhoodId: string): Promise<void>;

  abstract findByUser(userId: string): Promise<MembershipEntity[]>;

  abstract findMembers(neighbourhoodId: string): Promise<MembershipEntity[]>;
}
