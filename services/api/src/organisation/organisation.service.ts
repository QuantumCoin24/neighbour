import { Injectable } from '@nestjs/common';

import type { OrganisationEntity } from './organisation.entity';

import { OrganisationRepository } from './organisation.repository';

@Injectable()
export class OrganisationService {
  constructor(private readonly repository: OrganisationRepository) {}

  async create(data: {
    ownerId: string;
    name: string;
    description: string;
    type: string;
  }): Promise<OrganisationEntity> {
    return this.repository.save({
      id: crypto.randomUUID(),

      ownerId: data.ownerId,

      name: data.name,

      description: data.description,

      type: data.type,

      verified: false,

      createdAt: new Date(),
    });
  }

  async findById(id: string) {
    return this.repository.findById(id);
  }

  async findByOwner(ownerId: string) {
    return this.repository.findByOwner(ownerId);
  }

  async search(query: string) {
    return this.repository.search(query);
  }
}
