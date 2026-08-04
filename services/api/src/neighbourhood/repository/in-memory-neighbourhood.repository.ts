import { Injectable } from '@nestjs/common';

import type { NeighbourhoodEntity } from '../neighbourhood.entity';
import { NeighbourhoodRepository } from '../neighbourhood.repository';

@Injectable()
export class InMemoryNeighbourhoodRepository implements NeighbourhoodRepository {
  private neighbourhoods: NeighbourhoodEntity[] = [
    {
      id: 'blackley',
      name: 'Blackley',
      description: 'A local community connecting neighbours in Blackley.',
      localArea: 'Manchester',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'charlestown',
      name: 'Charlestown',
      description: 'A local community connecting neighbours in Charlestown.',
      localArea: 'Manchester',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'moston',
      name: 'Moston',
      description: 'A local community connecting neighbours in Moston.',
      localArea: 'Manchester',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async save(neighbourhood: NeighbourhoodEntity): Promise<NeighbourhoodEntity> {
    this.neighbourhoods.push(neighbourhood);
    return neighbourhood;
  }

  async findById(id: string): Promise<NeighbourhoodEntity | undefined> {
    return this.neighbourhoods.find((item) => item.id === id);
  }

  async findAll(): Promise<NeighbourhoodEntity[]> {
    return this.neighbourhoods;
  }

  async update(neighbourhood: NeighbourhoodEntity): Promise<NeighbourhoodEntity> {
    const index = this.neighbourhoods.findIndex((item) => item.id === neighbourhood.id);

    if (index !== -1) {
      this.neighbourhoods[index] = neighbourhood;
    }

    return neighbourhood;
  }
}
