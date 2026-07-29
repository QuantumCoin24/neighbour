export interface RecommendationEntity {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'community' | 'business' | 'event' | 'post';
  score: number;
  createdAt: Date;
}
