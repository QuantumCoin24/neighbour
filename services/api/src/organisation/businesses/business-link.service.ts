import { Injectable } from '@nestjs/common';

import { OrganisationBusinessRepository } from './business-link.repository';


@Injectable()
export class OrganisationBusinessService {


constructor(
private readonly repository:OrganisationBusinessRepository,
){}



async attach(
data:{
organisationId:string;
businessId:string;
},
){


return this.repository.save({

id:crypto.randomUUID(),

organisationId:data.organisationId,

businessId:data.businessId,

createdAt:new Date(),

});


}



findByOrganisation(
organisationId:string,
){

return this.repository.findByOrganisation(
organisationId,
);

}



remove(
organisationId:string,
businessId:string,
){

return this.repository.remove(
organisationId,
businessId,
);

}


}
