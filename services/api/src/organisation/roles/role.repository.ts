import type { OrganisationRoleEntity } from './role.entity';


export abstract class OrganisationRoleRepository {


abstract save(
role:OrganisationRoleEntity
):Promise<OrganisationRoleEntity>;


abstract findByOrganisation(
organisationId:string
):Promise<OrganisationRoleEntity[]>;


}
