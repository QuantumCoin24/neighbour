import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { ProfileEntity } from './profile.entity';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class PrismaProfileRepository extends ProfileRepository {
  constructor(
    private readonly database: DatabaseService,
  ) {
    super();
  }

  private map(profile: any): ProfileEntity {
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName ?? profile.username,
      avatarUrl: profile.avatarUrl ?? undefined,
      bio: profile.bio ?? undefined,
      localArea: profile.localArea ?? null,
      showLocalArea: profile.showLocalArea,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async save(profile: ProfileEntity): Promise<ProfileEntity> {
    const record = await this.database.userProfile.create({
      data: {
        id: profile.id,
        userId: profile.userId,
        username: profile.username,
        bio: profile.bio ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        localArea: profile.localArea,
        showLocalArea: profile.showLocalArea,
      },
    });

    return this.map(record);
  }

  async findById(id: string): Promise<ProfileEntity | undefined> {
    const record = await this.database.userProfile.findUnique({
      where: { id },
    });

    return record ? this.map(record) : undefined;
  }

  async findByUserId(userId: string): Promise<ProfileEntity | undefined> {
    const record = await this.database.userProfile.findUnique({
      where: { userId },
    });

    return record ? this.map(record) : undefined;
  }

  async findByUsername(username: string): Promise<ProfileEntity | undefined> {
    const record = await this.database.userProfile.findUnique({
      where: { username },
    });

    return record ? this.map(record) : undefined;
  }

  async update(profile: ProfileEntity): Promise<ProfileEntity> {
    const record = await this.database.userProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        username: profile.username,
        bio: profile.bio ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        localArea: profile.localArea,
        showLocalArea: profile.showLocalArea,
      },
    });

    return this.map(record);
  }
}
