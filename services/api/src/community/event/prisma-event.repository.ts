import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { EventEntity } from './event.entity';
import { EventRepository } from './event.repository';


@Injectable()
export class PrismaEventRepository extends EventRepository {

  constructor(
    private readonly database: DatabaseService,
  ) {
    super();
  }


  private map(event: any): EventEntity {

    return {
      id: event.id,
      communityId: event.communityId,
      creatorId: event.creatorId,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      createdAt: event.createdAt,
    };

  }


  async save(
    event: EventEntity,
  ): Promise<EventEntity> {

    const record =
      await this.database.event.create({
        data:{
          id:event.id,
          communityId:event.communityId,
          creatorId:event.creatorId,
          title:event.title,
          description:event.description,
          startsAt:event.startsAt,
          endsAt:event.endsAt,
        },
      });


    return this.map(record);

  }


  async findById(
    id:string,
  ):Promise<EventEntity|undefined>{

    const record =
      await this.database.event.findUnique({
        where:{
          id,
        },
      });


    return record
      ? this.map(record)
      : undefined;

  }


  async findByCommunity(
    communityId:string,
  ):Promise<EventEntity[]>{

    const records =
      await this.database.event.findMany({
        where:{
          communityId,
        },
        orderBy:{
          startsAt:"asc",
        },
      });


    return records.map(
      record=>this.map(record),
    );

  }


  async remove(
    id:string,
  ):Promise<void>{

    await this.database.event.delete({
      where:{
        id,
      },
    });

  }

}
