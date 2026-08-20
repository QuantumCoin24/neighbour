import { createHash, randomUUID } from 'node:crypto';

import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import type { Environment } from '../config/environment';
import { DatabaseService } from '../database/database.service';
import { UserStatus } from '../generated/prisma/client.js';
import type { User } from '../generated/prisma/client.js';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AccessTokenPayload, RefreshTokenPayload } from './interfaces/token-payload.interface';

import type { AuthResponse, AuthTokens } from './interfaces/auth-response.interface';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AuthService {
  private readonly config: Environment;

  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,

    @Inject(JwtService)
    private readonly jwtService: JwtService,

    @Inject(ConfigService)
    configService: ConfigService,

    private readonly profileService: ProfileService,
  ) {
    this.config = configService.getOrThrow<Environment>('app');
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.database.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const preferredUsername =
      dto.email
        .split('@')[0]
        ?.trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '')
        .replace(/^[._-]+|[._-]+$/g, '') ||
      dto.displayName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '')
        .replace(/^[._-]+|[._-]+$/g, '') ||
      'neighbour';

    const user = await this.database.$transaction(async (tx) => {
      let username = preferredUsername;
      let suffix = 2;

      while (
        await tx.userProfile.findUnique({
          where: { username },
          select: { id: true },
        })
      ) {
        username = `${preferredUsername}-${suffix}`;
        suffix += 1;
      }

      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          displayName: dto.displayName,
          passwordHash,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: createdUser.id,
          username,
          bio: null,
          avatarUrl: null,
          localArea: null,
          showLocalArea: true,
        },
      });

      return createdUser;
    });

    const tokens = await this.issueTokenPair(user);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.database.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active.');
    }

    const tokens = await this.issueTokenPair(user);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.database.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.userId !== payload.sub ||
      storedToken.id !== payload.jti ||
      storedToken.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    await this.database.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(storedToken.user);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const tokenHash = this.hashToken(refreshToken);

    await this.database.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  async deleteAccount(userId: string): Promise<{ success: true }> {
    const deletedPasswordHash = await argon2.hash(randomUUID(), {
      type: argon2.argon2id,
    });

    await this.database.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Authentication is no longer valid.');
      }

      await tx.refreshToken.deleteMany({
        where: {
          userId,
        },
      });

      await tx.userProfile.deleteMany({
        where: {
          userId,
        },
      });

      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          email: `deleted-${userId}@deleted.neighbour.invalid`,
          displayName: 'Deleted Neighbour',
          passwordHash: deletedPasswordHash,
          status: UserStatus.DELETED,
          emailVerifiedAt: null,
        },
      });
    });

    return {
      success: true,
    };
  }

  async findAuthenticatedUser(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication is no longer valid.');
    }

    return this.toPublicUser(user);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.jwtAccessSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid access token.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.jwtRefreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  private async issueTokenPair(user: User): Promise<AuthTokens> {
    const refreshTokenId = randomUUID();

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: refreshTokenId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.config.jwtAccessSecret,
        expiresIn: this.config.jwtAccessTtlSeconds,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.jwtRefreshSecret,
        expiresIn: this.config.jwtRefreshTtlSeconds,
      }),
    ]);

    await this.database.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.config.jwtRefreshTtlSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.jwtAccessTtlSeconds,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
