import { Injectable } from '@nestjs/common';

import type { OrganisationMemberEntity } from './member.entity';

import { OrganisationMemberRepository } from './member.repository';

@Injectable()
export class OrganisationMemberService {
  constructor(private readonly repository: OrganisationMemberRepository) {}

  async addMember(data: {
    organisationId: string;
    userId: string;
    role?: string;
  }): Promise<OrganisationMemberEntity> {
    return this.repository.save({
      id: crypto.randomUUID(),

      organisationId: data.organisationId,

      userId: data.userId,

      role: data.role ?? 'MEMBER',

      createdAt: new Date(),
    });
  }

  async findByOrganisation(organisationId: string) {
    return this.repository.findByOrganisation(organisationId);
  }

  async findByUser(userId: string) {
    return this.repository.findByUser(userId);
  }

  async remove(organisationId: string, userId: string) {
    return this.repository.remove(organisationId, userId);
  }
}
