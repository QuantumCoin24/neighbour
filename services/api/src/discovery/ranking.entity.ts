export interface RankingEntity {
  id: string;
  targetId: string;
  category: string;
  relevanceScore: number;
  trustScore: number;
  createdAt: Date;
}
