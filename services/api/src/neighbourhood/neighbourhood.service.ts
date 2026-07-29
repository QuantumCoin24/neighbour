import { Injectable } from '@nestjs/common';

import type { NeighbourhoodEntity } from './neighbourhood.entity';

import { NeighbourhoodRepository } from './neighbourhood.repository';

@Injectable()
export class NeighbourhoodService {
  constructor(private readonly repository: NeighbourhoodRepository) {}

  create(neighbourhood: NeighbourhoodEntity): Promise<NeighbourhoodEntity> {
    return this.repository.save(neighbourhood);
  }

  findById(id: string): Promise<NeighbourhoodEntity | undefined> {
    return this.repository.findById(id);
  }

  findAll(): Promise<NeighbourhoodEntity[]> {
    return this.repository.findAll();
  }

  update(neighbourhood: NeighbourhoodEntity): Promise<NeighbourhoodEntity> {
    return this.repository.update(neighbourhood);
  }
}
