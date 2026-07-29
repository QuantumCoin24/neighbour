export interface DiscoveryEntity {
  id: string;
  userId: string;
  category: string;
  targetId: string;
  relevanceScore: number;
  createdAt: Date;
}
