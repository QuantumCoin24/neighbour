export interface ReputationEntity {
  id: string;
  userId: string;
  score: number;
  contributions: number;
  recommendations: number;
  createdAt: Date;
  updatedAt: Date;
}
