import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { OrganisationBusinessEntity } from './business-link.entity';

import { OrganisationBusinessRepository } from './business-link.repository';


@Injectable()
export class PrismaOrganisationBusinessRepository
extends OrganisationBusinessRepository {


constructor(
private readonly database:DatabaseService,
){
super();
}



private map(record:any):OrganisationBusinessEntity {

return {

id:record.id,

organisationId:record.organisationId,

businessId:record.businessId,

createdAt:record.createdAt,

};

}



async save(
link:OrganisationBusinessEntity,
):Promise<OrganisationBusinessEntity>{


const record =
await this.database.organisationBusiness.create({

data:{

id:link.id,

organisationId:link.organisationId,

businessId:link.businessId,

},

});


return this.map(record);

}



async findByOrganisation(
organisationId:string,
):Promise<OrganisationBusinessEntity[]>{


const records =
await this.database.organisationBusiness.findMany({

where:{
organisationId,
},

});


return records.map(
record=>this.map(record),
);

}



async remove(
organisationId:string,
businessId:string,
):Promise<void>{


await this.database.organisationBusiness.delete({

where:{

organisationId_businessId:{
organisationId,
businessId,
},

},

});


}


}
