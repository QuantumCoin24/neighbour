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

    const community =
      await this.database.community.findUnique({
        where: {
          slug: membership.neighbourhoodId,
        },
      });

    if (!community) {
      throw new Error(
        `Community not found: ${membership.neighbourhoodId}`,
      );
    }

    const record =
      await this.database.membership.upsert({
        where:{
          userId_communityId:{
            userId: membership.userId,
            communityId: community.id,
          },
        },
        update:{
          status:'ACTIVE',
        },
        create:{
          id: membership.id,
          userId: membership.userId,
          communityId: community.id,
          role:'MEMBER',
          status:'ACTIVE',
        },
        include:{
          community:true,
        },
      });

    return {
      id: record.id,
      userId: record.userId,
      neighbourhoodId: record.communityId,
      createdAt: record.joinedAt,
      role: record.role,
      status: record.status,
      community: record.community,
    };
  }


  async remove(
    userId:string,
    neighbourhoodId:string,
  ):Promise<void>{

    await this.database.membership.delete({
      where:{
        userId_communityId:{
          userId,
          communityId:neighbourhoodId,
        },
      },
    });

  }


  async findByUser(
    userId:string,
  ):Promise<any[]>{

    const records =
      await this.database.membership.findMany({
        where:{
          userId,
          status:'ACTIVE',
        },
        include:{
          community:true,
        },
        orderBy:{
          joinedAt:'desc',
        },
      });


    return records.map(record=>({
      id:record.id,
      role:record.role,
      status:record.status,
      joinedAt:record.joinedAt,
      community:{
        id:record.community.id,
        name:record.community.name,
        slug:record.community.slug,
        description:record.community.description,
      },
    }));

  }


  async findMembers(
    communityId:string,
  ):Promise<any[]>{

    return this.database.membership.findMany({
      where:{
        communityId,
        status:'ACTIVE',
      },
      include:{
        user:{
          include:{
            profile:true,
          },
        },
      },
    });

  }
}
