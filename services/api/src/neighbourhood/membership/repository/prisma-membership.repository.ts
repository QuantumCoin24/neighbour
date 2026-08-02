import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../../database/database.service';

import type { MembershipEntity } from '../membership.entity';
import { MembershipRepository } from '../membership.repository';

@Injectable()
export class PrismaMembershipRepository
  implements MembershipRepository
{
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async save(
    membership: MembershipEntity,
  ): Promise<any> {

    const record =
      await this.database.neighbourhoodMembership.upsert({
        where: {
          userId_neighbourhoodId: {
            userId: membership.userId,
            neighbourhoodId: membership.neighbourhoodId,
          },
        },
        update: {},
        create: {
          id: membership.id,
          userId: membership.userId,
          neighbourhoodId: membership.neighbourhoodId,
        },
        include: {
          neighbourhood: true,
        },
      });

    return record;
  }


  async remove(
    userId: string,
    neighbourhoodId: string,
  ): Promise<void> {

    await this.database.neighbourhoodMembership.delete({
      where: {
        userId_neighbourhoodId: {
          userId,
          neighbourhoodId,
        },
      },
    });

  }


  async findByUser(
    userId: string,
  ): Promise<any[]> {

    return this.database.neighbourhoodMembership.findMany({
      where: {
        userId,
      },
      include: {
        neighbourhood: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

  }


  async findMembers(
    neighbourhoodId: string,
  ): Promise<any[]> {

    return this.database.neighbourhoodMembership.findMany({
      where: {
        neighbourhoodId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

  }
}
