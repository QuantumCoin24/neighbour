import type { TrailEntity } from './trail.entity';

export abstract class TrailRepository {
  abstract save(trail: TrailEntity): Promise<TrailEntity>;
  abstract findById(id: string): Promise<TrailEntity | undefined>;
  abstract findMine(creatorId: string): Promise<TrailEntity[]>;
  abstract findPublicPersonalByUsername(username: string): Promise<TrailEntity[]>;
  abstract findCommunity(communityId: string, requesterId: string): Promise<TrailEntity[]>;
  abstract update(trail: TrailEntity): Promise<TrailEntity>;
  abstract softDelete(id: string): Promise<void>;
}
