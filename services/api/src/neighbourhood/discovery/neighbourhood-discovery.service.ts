import { Injectable } from '@nestjs/common';

import type { NeighbourhoodEntity } from '../neighbourhood.entity';
import type { NeighbourhoodDiscoveryResponse } from './neighbourhood-discovery.response';

import { NeighbourhoodRepository } from '../neighbourhood.repository';

@Injectable()
export class NeighbourhoodDiscoveryService {
  constructor(private readonly repository: NeighbourhoodRepository) {}

  async search(): Promise<NeighbourhoodDiscoveryResponse[]> {
    const neighbourhoods = await this.repository.findAll();

    return neighbourhoods.map((item) => this.map(item));
  }

  private map(item: NeighbourhoodEntity): NeighbourhoodDiscoveryResponse {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      localArea: item.localArea,
    };
  }
}
