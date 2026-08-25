import { Injectable, NotFoundException } from '@nestjs/common';

import type { ProfileEntity } from './profile.entity';
import type {
  PrivateProfileResponse,
  PublicProfileResponse,
} from './interfaces/profile-response.interface';

import { ProfileRepository } from './profile.repository';
import { ProfileEventBusService } from './profile-event-bus.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly events: ProfileEventBusService,
  ) {}

  async create(profile: ProfileEntity): Promise<ProfileEntity> {
    const saved = await this.repository.save(profile);

    this.events.publish({
      type: 'profile.created',
      profileId: saved.id,
      userId: saved.userId,
      username: saved.username,
    });

    return saved;
  }

  getById(id: string): Promise<ProfileEntity | undefined> {
    return this.repository.findById(id);
  }

  getByUserId(userId: string): Promise<ProfileEntity | undefined> {
    return this.repository.findByUserId(userId);
  }

  async update(profile: ProfileEntity): Promise<ProfileEntity> {
    const updated = await this.repository.update(profile);

    this.events.publish({
      type: 'profile.updated',
      profileId: updated.id,
      userId: updated.userId,
    });

    return updated;
  }

  async findMine(userId: string): Promise<PrivateProfileResponse> {
    const profile = await this.repository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
      bio: profile.bio ?? null,
      localArea: profile.localArea,
      showLocalArea: profile.showLocalArea,
      postalCode: profile.postalCode ?? null,
      countryCode: profile.countryCode ?? null,
      city: profile.city ?? null,
      region: profile.region ?? null,
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateMine(userId: string, dto: Partial<ProfileEntity>): Promise<PrivateProfileResponse> {
    const existing = await this.repository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    const updated = await this.repository.update({
      ...existing,
      ...dto,
      updatedAt: new Date(),
    });

    return {
      id: updated.id,
      userId: updated.userId,
      username: updated.username,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl ?? null,
      bio: updated.bio ?? null,
      localArea: updated.localArea,
      showLocalArea: updated.showLocalArea,
      postalCode: updated.postalCode ?? null,
      countryCode: updated.countryCode ?? null,
      city: updated.city ?? null,
      region: updated.region ?? null,
      latitude: updated.latitude ?? null,
      longitude: updated.longitude ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async findPublicByUsername(username: string): Promise<PublicProfileResponse> {
    const profile = await this.repository.findByUsername(username);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
      bio: profile.bio ?? null,
      localArea: profile.showLocalArea ? profile.localArea : null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
