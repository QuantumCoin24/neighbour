import { Injectable } from '@nestjs/common';

import type { OrganisationVerificationEntity } from './verification.entity';

import { OrganisationVerificationRepository } from './verification.repository';

@Injectable()
export class OrganisationVerificationService {
  constructor(private readonly repository: OrganisationVerificationRepository) {}

  async submit(data: {
    organisationId: string;
    notes?: string;
  }): Promise<OrganisationVerificationEntity> {
    return this.repository.save({
      id: crypto.randomUUID(),

      organisationId: data.organisationId,

      status: 'PENDING',

      ...(data.notes !== undefined ? { notes: data.notes } : {}),

      submittedAt: new Date(),
    });
  }

  async findByOrganisation(organisationId: string) {
    return this.repository.findByOrganisation(organisationId);
  }

  async updateStatus(organisationId: string, status: string) {
    return this.repository.updateStatus(organisationId, status);
  }
}
