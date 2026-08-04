export interface OrganisationVerificationEntity {
  id: string;

  organisationId: string;

  status: string;

  notes?: string;

  submittedAt: Date;

  reviewedAt?: Date | null;
}
