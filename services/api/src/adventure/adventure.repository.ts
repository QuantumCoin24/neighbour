import type { AdventureEntity } from './adventure.entity';

export abstract class AdventureRepository {
  abstract save(adventure: AdventureEntity): Promise<AdventureEntity>;
  abstract findById(id: string): Promise<AdventureEntity | undefined>;
  abstract findMine(creatorId: string): Promise<AdventureEntity[]>;
  abstract findPublicPersonalByUsername(username: string): Promise<AdventureEntity[]>;
  abstract findCommunity(communityId: string, requesterId: string): Promise<AdventureEntity[]>;
  abstract update(adventure: AdventureEntity): Promise<AdventureEntity>;
  abstract softDelete(id: string): Promise<void>;
}
