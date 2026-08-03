import { Injectable } from '@nestjs/common';

import type { OrganisationRoleEntity } from './role.entity';

import { OrganisationRoleRepository } from './role.repository';


@Injectable()
export class OrganisationRoleService {


constructor(
private readonly repository:OrganisationRoleRepository,
){}



async create(
data:{
organisationId:string;
name:string;
},
):Promise<OrganisationRoleEntity>{


return this.repository.save({

id:crypto.randomUUID(),

organisationId:data.organisationId,

name:data.name,

createdAt:new Date(),

});


}



async findByOrganisation(
organisationId:string,
){

return this.repository.findByOrganisation(
organisationId,
);

}


}
