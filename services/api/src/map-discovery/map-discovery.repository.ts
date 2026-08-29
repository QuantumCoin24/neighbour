import type { MapDiscoveryEntity } from './map-discovery.entity';

export abstract class MapDiscoveryRepository {
  abstract save(discovery: MapDiscoveryEntity): Promise<MapDiscoveryEntity>;
  abstract findById(id: string): Promise<MapDiscoveryEntity | undefined>;
  abstract update(discovery: MapDiscoveryEntity): Promise<MapDiscoveryEntity>;
  abstract findMine(creatorId: string): Promise<MapDiscoveryEntity[]>;
  abstract findPublicPersonalByUsername(username: string): Promise<MapDiscoveryEntity[]>;
  abstract findCommunity(communityId: string): Promise<MapDiscoveryEntity[]>;
  abstract softDelete(id: string): Promise<void>;
}
