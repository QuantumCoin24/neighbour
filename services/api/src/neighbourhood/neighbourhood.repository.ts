import type { NeighbourhoodEntity } from './neighbourhood.entity';

export abstract class NeighbourhoodRepository {
  abstract save(neighbourhood: NeighbourhoodEntity): Promise<NeighbourhoodEntity>;

  abstract findById(id: string): Promise<NeighbourhoodEntity | undefined>;

  abstract findAll(): Promise<NeighbourhoodEntity[]>;

  abstract update(neighbourhood: NeighbourhoodEntity): Promise<NeighbourhoodEntity>;
}
