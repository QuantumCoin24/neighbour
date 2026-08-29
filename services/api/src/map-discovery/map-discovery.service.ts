import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  LocationVisibility,
  MapDiscoveryCategory,
  MapDiscoveryScope,
  MapDiscoveryType,
  MembershipRole,
  MembershipStatus,
} from '../generated/prisma/client.js';
import type { CreateMapDiscoveryDto } from './dto/create-map-discovery.dto';
import type { UpdateMapDiscoveryDto } from './dto/update-map-discovery.dto';
import type { MapDiscoveryEntity } from './map-discovery.entity';
import { MapDiscoveryRepository } from './map-discovery.repository';

@Injectable()
export class MapDiscoveryService {
  constructor(
    private readonly repository: MapDiscoveryRepository,
    private readonly database: DatabaseService,
  ) {}

  async create(userId: string, dto: CreateMapDiscoveryDto): Promise<MapDiscoveryEntity> {
    const communityId = dto.communityId ?? null;

    if (dto.scope === MapDiscoveryScope.PERSONAL && communityId !== null) {
      throw new BadRequestException('Personal discoveries cannot belong to a community.');
    }

    if (dto.scope === MapDiscoveryScope.COMMUNITY && communityId === null) {
      throw new BadRequestException('Community discoveries require a community.');
    }

    if (
      dto.scope === MapDiscoveryScope.PERSONAL &&
      dto.visibility === LocationVisibility.COMMUNITY
    ) {
      throw new BadRequestException('Personal discoveries cannot use community visibility.');
    }

    if (dto.scope === MapDiscoveryScope.COMMUNITY && dto.visibility === LocationVisibility.PUBLIC) {
      throw new BadRequestException('Community discoveries cannot be globally public.');
    }

    if (dto.scope === MapDiscoveryScope.COMMUNITY && communityId) {
      const membership = await this.database.membership.findFirst({
        where: {
          userId,
          communityId,
          status: MembershipStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (!membership) {
        throw new ForbiddenException(
          'You must be an active member to add discoveries to this community.',
        );
      }
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (
      (dto.type === MapDiscoveryType.MOMENT || dto.type === MapDiscoveryType.SEASONAL) &&
      !expiresAt
    ) {
      throw new BadRequestException('Moments and seasonal discoveries require an expiry date.');
    }

    if (dto.type === MapDiscoveryType.LANDMARK && expiresAt) {
      throw new BadRequestException('Landmarks are persistent and cannot have an expiry date.');
    }

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Discovery expiry must be in the future.');
    }

    if (startsAt && expiresAt && startsAt.getTime() >= expiresAt.getTime()) {
      throw new BadRequestException('Discovery start must be before its expiry.');
    }

    const visibility =
      dto.visibility ??
      (dto.scope === MapDiscoveryScope.COMMUNITY
        ? LocationVisibility.COMMUNITY
        : LocationVisibility.PRIVATE);

    if (
      dto.scope === MapDiscoveryScope.PERSONAL &&
      visibility === LocationVisibility.PUBLIC &&
      (dto.locationAccuracyM === undefined || dto.locationAccuracyM < 25)
    ) {
      throw new BadRequestException(
        'Public personal discoveries must use a location accuracy of at least 25 metres.',
      );
    }

    const duplicate = await this.repository.findDuplicateCandidate(
      userId,
      dto.scope,
      dto.communityId ?? null,
      dto.latitude,
      dto.longitude,
    );

    if (duplicate) {
      throw new ConflictException(
        'You already have an active discovery at this location on this map.',
      );
    }

    return this.repository.save({
      id: crypto.randomUUID(),
      creatorId: userId,
      communityId,
      scope: dto.scope,
      type: dto.type,
      category: dto.category ?? MapDiscoveryCategory.OTHER,
      title: dto.title.trim(),
      description: dto.description.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationAccuracyM: dto.locationAccuracyM ?? null,
      visibility,
      startsAt,
      expiresAt,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  findMine(userId: string): Promise<MapDiscoveryEntity[]> {
    return this.repository.findMine(userId);
  }

  findPublicProfile(username: string): Promise<MapDiscoveryEntity[]> {
    return this.repository.findPublicPersonalByUsername(username);
  }

  async findCommunity(userId: string, communityId: string): Promise<MapDiscoveryEntity[]> {
    const membership = await this.database.membership.findFirst({
      where: {
        userId,
        communityId,
        status: MembershipStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('You must be an active member to view this community map.');
    }

    return this.repository.findCommunity(communityId);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateMapDiscoveryDto,
  ): Promise<MapDiscoveryEntity> {
    const discovery = await this.repository.findById(id);

    if (!discovery || discovery.deletedAt) {
      throw new NotFoundException('Map discovery not found.');
    }

    if (discovery.creatorId !== userId) {
      throw new ForbiddenException('Only the discovery creator can edit this discovery.');
    }

    const type = dto.type ?? discovery.type;
    const visibility = dto.visibility ?? discovery.visibility;

    if (
      discovery.scope === MapDiscoveryScope.PERSONAL &&
      visibility === LocationVisibility.COMMUNITY
    ) {
      throw new BadRequestException('Personal discoveries cannot use community visibility.');
    }

    if (
      discovery.scope === MapDiscoveryScope.COMMUNITY &&
      visibility === LocationVisibility.PUBLIC
    ) {
      throw new BadRequestException('Community discoveries cannot be globally public.');
    }

    if (discovery.scope === MapDiscoveryScope.COMMUNITY && discovery.communityId) {
      const membership = await this.database.membership.findFirst({
        where: {
          userId,
          communityId: discovery.communityId,
          status: MembershipStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (!membership) {
        throw new ForbiddenException(
          'You must be an active member to edit discoveries in this community.',
        );
      }
    }

    const startsAt =
      dto.startsAt === undefined
        ? discovery.startsAt
        : dto.startsAt === null
          ? null
          : new Date(dto.startsAt);

    const expiresAt =
      dto.expiresAt === undefined
        ? discovery.expiresAt
        : dto.expiresAt === null
          ? null
          : new Date(dto.expiresAt);

    if ((type === MapDiscoveryType.MOMENT || type === MapDiscoveryType.SEASONAL) && !expiresAt) {
      throw new BadRequestException('Moments and seasonal discoveries require an expiry date.');
    }

    if (type === MapDiscoveryType.LANDMARK && expiresAt) {
      throw new BadRequestException('Landmarks are persistent and cannot have an expiry date.');
    }

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Discovery expiry must be in the future.');
    }

    if (startsAt && expiresAt && startsAt.getTime() >= expiresAt.getTime()) {
      throw new BadRequestException('Discovery start must be before its expiry.');
    }

    const latitude = dto.latitude ?? discovery.latitude;
    const longitude = dto.longitude ?? discovery.longitude;
    const locationAccuracyM = dto.locationAccuracyM ?? discovery.locationAccuracyM;

    if (
      discovery.scope === MapDiscoveryScope.PERSONAL &&
      visibility === LocationVisibility.PUBLIC &&
      (locationAccuracyM === null || locationAccuracyM < 25)
    ) {
      throw new BadRequestException(
        'Public personal discoveries must use a location accuracy of at least 25 metres.',
      );
    }

    const duplicate = await this.repository.findDuplicateCandidate(
      userId,
      discovery.scope,
      discovery.communityId,
      latitude,
      longitude,
      discovery.id,
    );

    if (duplicate) {
      throw new ConflictException(
        'You already have an active discovery at this location on this map.',
      );
    }

    return this.repository.update({
      ...discovery,
      type,
      category: dto.category ?? discovery.category,
      title: dto.title === undefined ? discovery.title : dto.title.trim(),
      description: dto.description === undefined ? discovery.description : dto.description.trim(),
      latitude,
      longitude,
      locationAccuracyM,
      visibility,
      startsAt,
      expiresAt,
      updatedAt: new Date(),
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const discovery = await this.repository.findById(id);

    if (!discovery || discovery.deletedAt) {
      throw new NotFoundException('Map discovery not found.');
    }

    if (discovery.creatorId === userId) {
      await this.repository.softDelete(id);
      return;
    }

    if (!discovery.communityId) {
      throw new ForbiddenException('You do not have permission to remove this discovery.');
    }

    const membership = await this.database.membership.findFirst({
      where: {
        userId,
        communityId: discovery.communityId,
        status: MembershipStatus.ACTIVE,
        role: {
          in: [MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MODERATOR],
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have permission to remove this discovery.');
    }

    await this.repository.softDelete(id);
  }
}
