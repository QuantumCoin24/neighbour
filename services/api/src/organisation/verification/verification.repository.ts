import type { OrganisationVerificationEntity } from './verification.entity';


export abstract class OrganisationVerificationRepository {


abstract save(
verification:OrganisationVerificationEntity
):Promise<OrganisationVerificationEntity>;



abstract findByOrganisation(
organisationId:string
):Promise<OrganisationVerificationEntity|undefined>;



abstract updateStatus(
organisationId:string,
status:string,
):Promise<OrganisationVerificationEntity>;



}
