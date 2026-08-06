import { Injectable } from '@nestjs/common';

import type { NearbyResult } from '../interfaces/nearby-response.interface';

export interface NearbyRankingInput {
  distanceKm: number;
  radiusKm: number;
  verified: boolean;
  popularity: number;
  freshness: number;
  trustScore?: number;
  startsAt?: Date | null;
}

@Injectable()
export class NearbyRankingService {
  calculate(input: NearbyRankingInput): number {
    const normalizedDistance = Math.min(input.distanceKm / Math.max(input.radiusKm, 0.1), 1);

    const distanceScore = (1 - normalizedDistance) * 45;

    const verificationScore = input.verified ? 12 : 0;

    const popularityScore = Math.min(Math.max(input.popularity, 0), 100) * 0.18;

    const freshnessScore = Math.min(Math.max(input.freshness, 0), 100) * 0.15;

    const trustScore = Math.min(Math.max(input.trustScore ?? 0, 0), 100) * 0.1;

    const upcomingEventScore = input.startsAt && input.startsAt.getTime() >= Date.now() ? 5 : 0;

    return Number(
      Math.min(
        100,
        distanceScore +
          verificationScore +
          popularityScore +
          freshnessScore +
          trustScore +
          upcomingEventScore,
      ).toFixed(2),
    );
  }

  sort(results: NearbyResult[], sort: 'RELEVANCE' | 'DISTANCE' | 'NEWEST'): NearbyResult[] {
    return [...results].sort((left, right) => {
      if (sort === 'DISTANCE') {
        return left.distanceKm - right.distanceKm;
      }

      if (sort === 'NEWEST') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      return right.relevanceScore - left.relevanceScore || left.distanceKm - right.distanceKm;
    });
  }
}
