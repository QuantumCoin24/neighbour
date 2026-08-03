import type { OrganisationMemberEntity } from './member.entity';


export abstract class OrganisationMemberRepository {


abstract save(
member:OrganisationMemberEntity
):Promise<OrganisationMemberEntity>;



abstract findByOrganisation(
organisationId:string
):Promise<OrganisationMemberEntity[]>;



abstract findByUser(
userId:string
):Promise<OrganisationMemberEntity[]>;



abstract remove(
organisationId:string,
userId:string,
):Promise<void>;


}
