import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import type { OrganisationEntity } from './organisation.entity';

import { OrganisationRepository } from './organisation.repository';



@Injectable()
export class PrismaOrganisationRepository
extends OrganisationRepository {



constructor(
private readonly database:DatabaseService,
){
super();
}




private map(
record:any
):OrganisationEntity {


return {

id:record.id,

ownerId:record.ownerId,

name:record.name,

description:record.description,

type:record.type,

verified:record.verified,

createdAt:record.createdAt,

};


}




async save(
organisation:OrganisationEntity,
):Promise<OrganisationEntity>{


const record =
await this.database.organisation.create({

data:{

id:organisation.id,

ownerId:organisation.ownerId,

name:organisation.name,

description:organisation.description,

type:organisation.type,

verified:organisation.verified,

},

});


return this.map(record);

}





async findById(
id:string,
):Promise<OrganisationEntity|undefined>{


const record =
await this.database.organisation.findUnique({

where:{
id,
},

});


return record
?
this.map(record)
:
undefined;


}





async findByOwner(
ownerId:string,
):Promise<OrganisationEntity[]>{


const records =
await this.database.organisation.findMany({

where:{
ownerId,
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
):Promise<OrganisationEntity[]>{


const records =
await this.database.organisation.findMany({

where:{

OR:[

{
name:{
contains:query,
mode:"insensitive",
},
},

{
type:{
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
