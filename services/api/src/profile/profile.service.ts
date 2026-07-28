import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  PrivateProfileResponse,
  PublicProfileResponse,
} from './interfaces/profile-response.interface';
import { createUsernameCandidate, normaliseUsername } from './utils/profile-username.util';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async findMine(userId: string): Promise<PrivateProfileResponse> {
    const profile = await this.ensureProfile(userId);

    return this.toPrivateResponse(profile);
  }

  async updateMine(userId: string, dto: UpdateProfileDto): Promise<PrivateProfileResponse> {
    const existingProfile = await this.ensureProfile(userId);

    if (dto.username && normaliseUsername(dto.username) !== existingProfile.username) {
      await this.assertUsernameAvailable(dto.username, userId);
    }

    const profile = await this.database.userProfile.update({
      where: {
        userId,
      },
      data: {
        ...(dto.username !== undefined ? { username: normaliseUsername(dto.username) } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio.length > 0 ? dto.bio : null } : {}),
        ...(dto.avatarUrl !== undefined
          ? {
              avatarUrl: dto.avatarUrl.length > 0 ? dto.avatarUrl : null,
            }
          : {}),
        ...(dto.localArea !== undefined
          ? {
              localArea: dto.localArea.length > 0 ? dto.localArea : null,
            }
          : {}),
        ...(dto.showLocalArea !== undefined ? { showLocalArea: dto.showLocalArea } : {}),
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return this.toPrivateResponse(profile);
  }

  async findPublicByUsername(username: string): Promise<PublicProfileResponse> {
    const profile = await this.database.userProfile.findUnique({
      where: {
        username: normaliseUsername(username),
      },
      include: {
        user: {
          select: {
            displayName: true,
            status: true,
          },
        },
      },
    });

    if (!profile || profile.user.status !== 'ACTIVE') {
      throw new NotFoundException('Profile not found.');
    }

    return this.toPublicResponse(profile);
  }

  private async ensureProfile(userId: string) {
    const existingProfile = await this.database.userProfile.findUnique({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (existingProfile) {
      return existingProfile;
    }

    const user = await this.database.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        displayName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const username = await this.generateAvailableUsername(user.displayName, user.id);

    return this.database.userProfile.create({
      data: {
        userId,
        username,
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });
  }

  private async assertUsernameAvailable(username: string, currentUserId: string): Promise<void> {
    const existingProfile = await this.database.userProfile.findUnique({
      where: {
        username: normaliseUsername(username),
      },
      select: {
        userId: true,
      },
    });

    if (existingProfile && existingProfile.userId !== currentUserId) {
      throw new ConflictException('Username is already in use.');
    }
  }

  private async generateAvailableUsername(displayName: string, userId: string): Promise<string> {
    const baseCandidate = createUsernameCandidate(displayName, userId);

    let candidate = baseCandidate;
    let suffix = 2;

    while (
      await this.database.userProfile.findUnique({
        where: {
          username: candidate,
        },
        select: {
          id: true,
        },
      })
    ) {
      const suffixText = `.${suffix}`;
      candidate = `${baseCandidate.slice(0, 30 - suffixText.length)}${suffixText}`;

      suffix += 1;
    }

    return candidate;
  }

  private toPrivateResponse(profile: {
    id: string;
    userId: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    localArea: string | null;
    showLocalArea: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      displayName: string;
    };
  }): PrivateProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.user.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      localArea: profile.localArea,
      showLocalArea: profile.showLocalArea,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private toPublicResponse(profile: {
    id: string;
    userId: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    localArea: string | null;
    showLocalArea: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      displayName: string;
    };
  }): PublicProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.user.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      localArea: profile.showLocalArea ? profile.localArea : null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
