import type { OrganisationBusinessEntity } from './business-link.entity';

export abstract class OrganisationBusinessRepository {
  abstract save(link: OrganisationBusinessEntity): Promise<OrganisationBusinessEntity>;

  abstract findByOrganisation(organisationId: string): Promise<OrganisationBusinessEntity[]>;

  abstract remove(organisationId: string, businessId: string): Promise<void>;
}
