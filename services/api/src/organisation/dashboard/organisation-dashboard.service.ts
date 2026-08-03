import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';


@Injectable()
export class OrganisationDashboardService {


constructor(
private readonly database:DatabaseService,
){}



async getDashboard(
organisationId:string,
){


const organisation =
await this.database.organisation.findUnique({

where:{
id:organisationId,
},

include:{

members:true,

roles:true,

businesses:true,

verification:true,

},

});



if(!organisation){

return null;

}



return {

organisation:{

id:organisation.id,

name:organisation.name,

type:organisation.type,

verified:organisation.verified,

},


metrics:{

members:
organisation.members.length,

roles:
organisation.roles.length,

businesses:
organisation.businesses.length,

verification:
organisation.verification?.status ?? "PENDING",

},


};

}



}
