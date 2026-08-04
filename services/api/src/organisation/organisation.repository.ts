import type { OrganisationEntity } from './organisation.entity';

export abstract class OrganisationRepository {
  abstract save(organisation: OrganisationEntity): Promise<OrganisationEntity>;

  abstract findById(id: string): Promise<OrganisationEntity | undefined>;

  abstract findByOwner(ownerId: string): Promise<OrganisationEntity[]>;

  abstract search(query: string): Promise<OrganisationEntity[]>;
}
