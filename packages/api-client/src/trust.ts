import { apiRequest } from './client';

export interface TrustReputation {
  id: string;
  userId: string;
  score: number;
  contributions: number;
  recommendations: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrustVerification {
  id: string;
  subjectId: string;
  subjectType: 'user' | 'business';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface TrustProfile {
  reputation: TrustReputation | null;
  verification: TrustVerification[];
}

export interface TrustIntelligence {
  userId: string;
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: {
    reputation: number;
    verified: boolean;
  };
}

export function getMyTrustProfile(): Promise<TrustProfile> {
  return apiRequest<TrustProfile>('/trust/me');
}

export function getMyTrustIntelligence(): Promise<TrustIntelligence> {
  return apiRequest<TrustIntelligence>('/trust/me/intelligence');
}
