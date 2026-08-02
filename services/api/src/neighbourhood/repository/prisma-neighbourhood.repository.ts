import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { NeighbourhoodEntity } from '../neighbourhood.entity';
import { NeighbourhoodRepository } from '../neighbourhood.repository';

@Injectable()
export class PrismaNeighbourhoodRepository
  implements NeighbourhoodRepository
{
  constructor(
    private readonly database: DatabaseService,
  ) {}

  private map(record: any): NeighbourhoodEntity {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      localArea: record.localArea,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async save(
    neighbourhood: NeighbourhoodEntity,
  ): Promise<NeighbourhoodEntity> {
    const record = await this.database.neighbourhood.create({
      data: {
        id: neighbourhood.id,
        name: neighbourhood.name,
        description: neighbourhood.description,
        localArea: neighbourhood.localArea,
      },
    });

    return this.map(record);
  }

  async findById(
    id: string,
  ): Promise<NeighbourhoodEntity | undefined> {
    const record = await this.database.neighbourhood.findUnique({
      where: { id },
    });

    return record ? this.map(record) : undefined;
  }

  async findAll(): Promise<NeighbourhoodEntity[]> {
    const records = await this.database.neighbourhood.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return records.map((record) => this.map(record));
  }

  async update(
    neighbourhood: NeighbourhoodEntity,
  ): Promise<NeighbourhoodEntity> {
    const record = await this.database.neighbourhood.update({
      where: {
        id: neighbourhood.id,
      },
      data: {
        name: neighbourhood.name,
        description: neighbourhood.description,
        localArea: neighbourhood.localArea,
      },
    });

    return this.map(record);
  }
}
