import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { BusinessEntity } from './business.entity';
import { BusinessRepository } from './business.repository';


@Injectable()
export class PrismaBusinessRepository extends BusinessRepository {


  constructor(
    private readonly database: DatabaseService,
  ){
    super();
  }



  private map(
    business:any,
  ):BusinessEntity {

    return {

      id: business.id,

      communityId:
        business.communityId,

      ownerId:
        business.ownerId,

      name:
        business.name,

      description:
        business.description,

      category:
        business.category,

      createdAt:
        business.createdAt,

    };

  }



  async save(
    business:BusinessEntity,
  ):Promise<BusinessEntity>{


    const record =
      await this.database.business.create({

        data:{

          id:
            business.id,

          communityId:
            business.communityId,

          ownerId:
            business.ownerId,

          name:
            business.name,

          description:
            business.description,

          category:
            business.category,

        },

      });


    return this.map(record);

  }




  async findById(
    id:string,
  ):Promise<BusinessEntity|undefined>{


    const record =
      await this.database.business.findUnique({

        where:{
          id,
        },

      });


    return record
      ? this.map(record)
      : undefined;

  }





  async findByOwner(
    ownerId:string,
  ):Promise<BusinessEntity|undefined>{


    const record =
      await this.database.business.findFirst({

        where:{
          ownerId,
        },

      });


    return record
      ? this.map(record)
      : undefined;

  }






  async findByCommunity(
    communityId:string,
  ):Promise<BusinessEntity[]>{


    const records =
      await this.database.business.findMany({

        where:{
          communityId,
        },

        orderBy:{
          createdAt:"desc",
        },

      });


    return records.map(
      record=>this.map(record),
    );

  }





  async search(
    query:string,
  ):Promise<BusinessEntity[]>{


    const records =
      await this.database.business.findMany({

        where:{

          OR:[

            {
              name:{
                contains:query,
                mode:"insensitive",
              },
            },

            {
              category:{
                contains:query,
                mode:"insensitive",
              },
            },

          ],

        },

      });


    return records.map(
      record=>this.map(record),
    );

  }


}
