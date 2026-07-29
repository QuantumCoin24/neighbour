import { Injectable, NotFoundException } from '@nestjs/common';

import type { ProfileEntity } from './profile.entity';
import type {
  PrivateProfileResponse,
  PublicProfileResponse,
} from './interfaces/profile-response.interface';

import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
  ) {}

  create(
    profile: ProfileEntity,
  ): Promise<ProfileEntity> {
    return this.repository.save(profile);
  }

  getById(
    id: string,
  ): Promise<ProfileEntity | undefined> {
    return this.repository.findById(id);
  }

  getByUserId(
    userId: string,
  ): Promise<ProfileEntity | undefined> {
    return this.repository.findByUserId(userId);
  }

  update(
    profile: ProfileEntity,
  ): Promise<ProfileEntity> {
    return this.repository.update(profile);
  }

  async findMine(
    userId: string,
  ): Promise<PrivateProfileResponse> {
    const profile =
      await this.repository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException(
        'Profile not found',
      );
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
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateMine(
    userId: string,
    dto: Partial<ProfileEntity>,
  ): Promise<PrivateProfileResponse> {
    const existing =
      await this.repository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException(
        'Profile not found',
      );
    }

    const updated =
      await this.repository.update({
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
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async findPublicByUsername(
    username: string,
  ): Promise<PublicProfileResponse> {
    const profile =
      await this.repository.findByUsername(username);

    if (!profile) {
      throw new NotFoundException(
        'Profile not found',
      );
    }

    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl ?? null,
      bio: profile.bio ?? null,
      localArea: profile.localArea,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}