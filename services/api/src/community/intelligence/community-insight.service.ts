import { Injectable } from '@nestjs/common';

@Injectable()
export class CommunityInsightService {
  calculateEngagement(input: { posts: number; events: number; members: number }) {
    const score = input.posts * 3 + input.events * 5 + input.members;

    return {
      engagementScore: score,

      level: score > 100 ? 'HIGH' : score > 40 ? 'MEDIUM' : 'LOW',
    };
  }

  summary(input: { communityId: string; posts: number; events: number; members: number }) {
    return {
      communityId: input.communityId,

      metrics: this.calculateEngagement(input),
    };
  }
}
