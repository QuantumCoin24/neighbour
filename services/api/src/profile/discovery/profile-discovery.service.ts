import { Injectable } from '@nestjs/common';

import type { ProfileEntity } from '../profile.entity';
import type { DiscoverableProfileResponse } from './profile-discovery.response';

import { ProfileRepository } from '../profile.repository';

@Injectable()
export class ProfileDiscoveryService {
  constructor(private readonly repository: ProfileRepository) {}

  async findByUsername(username: string): Promise<DiscoverableProfileResponse | undefined> {
    const profile = await this.repository.findByUsername(username);

    if (!profile) {
      return undefined;
    }

    return this.map(profile);
  }

  private map(profile: ProfileEntity): DiscoverableProfileResponse {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
      bio: profile.bio ?? null,
      localArea: profile.showLocalArea ? profile.localArea : null,
      completionScore: this.score(profile),
    };
  }

  private score(profile: ProfileEntity): number {
    let score = 0;

    if (profile.username) score += 25;
    if (profile.displayName) score += 25;
    if (profile.avatarUrl) score += 20;
    if (profile.bio) score += 15;
    if (profile.localArea) score += 15;

    return score;
  }
}
