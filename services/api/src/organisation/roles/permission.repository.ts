import type { OrganisationPermissionEntity } from './permission.entity';


export abstract class OrganisationPermissionRepository {


abstract save(
permission:OrganisationPermissionEntity
):Promise<OrganisationPermissionEntity>;


abstract findByRole(
roleId:string
):Promise<OrganisationPermissionEntity[]>;


}
