import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { OrganisationRoleEntity } from './role.entity';

import { OrganisationRoleRepository } from './role.repository';


@Injectable()
export class PrismaOrganisationRoleRepository
extends OrganisationRoleRepository {


constructor(
private readonly database:DatabaseService,
){
super();
}



private map(
record:any,
):OrganisationRoleEntity {

return {

id:record.id,

organisationId:record.organisationId,

name:record.name,

createdAt:record.createdAt,

};

}



async save(
role:OrganisationRoleEntity,
):Promise<OrganisationRoleEntity>{


const record =
await this.database.organisationRole.create({

data:{

id:role.id,

organisationId:role.organisationId,

name:role.name,

},

});


return this.map(record);

}





async findByOrganisation(
organisationId:string,
):Promise<OrganisationRoleEntity[]>{


const records =
await this.database.organisationRole.findMany({

where:{
organisationId,
},

orderBy:{
createdAt:"desc",
},

});


return records.map(
(record)=>this.map(record),
);


}



}
