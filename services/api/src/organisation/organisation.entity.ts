export interface OrganisationEntity {
  id: string;

  ownerId: string;

  name: string;

  description: string;

  type: string;

  verified: boolean;

  createdAt: Date;
}
