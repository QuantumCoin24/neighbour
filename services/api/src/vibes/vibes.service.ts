import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { MembershipStatus, Prisma, VibeStatus, VibeVisibility } from '../generated/prisma/client';

import type { CreateVibeCommentDto } from './dto/create-vibe-comment.dto';
import type { CreateVibeDto } from './dto/create-vibe.dto';
import type { RecordVibeViewDto } from './dto/record-vibe-view.dto';
import type { UpdateVibeDto } from './dto/update-vibe.dto';
import type { VibeFeedQueryDto } from './dto/vibe-feed-query.dto';
import type { VibeReactionDto } from './dto/vibe-reaction.dto';
import type {
  VibeCommentResponse,
  VibeEngagementResponse,
  VibeFeedResponse,
  VibeResponse,
  VibeSaveResponse,
  VibeViewReceiptResponse,
} from './interfaces/vibe-response.interface';

const vibeInclude = {
  creator: {
    include: {
      profile: true,
    },
  },
  media: {
    include: {
      media: true,
    },
    orderBy: {
      position: 'asc',
    },
  },
} satisfies Prisma.VibeInclude;

type VibeWithRelations = Prisma.VibeGetPayload<{
  include: typeof vibeInclude;
}>;

const commentInclude = {
  author: {
    include: {
      profile: true,
    },
  },
} satisfies Prisma.VibeCommentInclude;

type CommentWithAuthor = Prisma.VibeCommentGetPayload<{
  include: typeof commentInclude;
}>;

@Injectable()
export class VibesService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(currentUserId: string, dto: CreateVibeDto): Promise<VibeResponse> {
    const status = dto.status ?? VibeStatus.PUBLISHED;
    const visibility = dto.visibility ?? VibeVisibility.PUBLIC;

    await this.validateAudience(
      currentUserId,
      dto.communityId ?? null,
      dto.neighbourhoodId ?? null,
      visibility,
    );

    const mediaIds = dto.mediaIds ?? [];

    await this.requireOwnedReadyMedia(currentUserId, mediaIds);

    const created = await this.database.$transaction(async (tx) => {
      const vibe = await tx.vibe.create({
        data: {
          creatorId: currentUserId,
          communityId: dto.communityId ?? null,
          neighbourhoodId: dto.neighbourhoodId ?? null,
          caption: this.normaliseOptionalText(dto.caption),
          status,
          visibility,
          ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
          ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
          ...(dto.locationAccuracyM !== undefined
            ? { locationAccuracyM: dto.locationAccuracyM }
            : {}),
          postcode: this.normaliseOptionalText(dto.postcode),
          publishedAt: status === VibeStatus.PUBLISHED ? new Date() : null,
        },
        select: {
          id: true,
        },
      });

      if (mediaIds.length > 0) {
        await tx.vibeMedia.createMany({
          data: mediaIds.map((mediaId, position) => ({
            vibeId: vibe.id,
            mediaId,
            position,
          })),
        });
      }

      return vibe;
    });

    return this.findOne(currentUserId, created.id);
  }

  async update(currentUserId: string, vibeId: string, dto: UpdateVibeDto): Promise<VibeResponse> {
    const existing = await this.requireOwnedVibe(currentUserId, vibeId);

    const nextCommunityId = dto.communityId === undefined ? existing.communityId : dto.communityId;

    const nextNeighbourhoodId =
      dto.neighbourhoodId === undefined ? existing.neighbourhoodId : dto.neighbourhoodId;

    const nextVisibility = dto.visibility ?? existing.visibility;

    await this.validateAudience(
      currentUserId,
      nextCommunityId,
      nextNeighbourhoodId,
      nextVisibility,
    );

    if (dto.mediaIds !== undefined) {
      await this.requireOwnedReadyMedia(currentUserId, dto.mediaIds);
    }

    const nextStatus = dto.status ?? existing.status;

    const publishing =
      existing.status !== VibeStatus.PUBLISHED && nextStatus === VibeStatus.PUBLISHED;

    await this.database.$transaction(async (tx) => {
      await tx.vibe.update({
        where: {
          id: vibeId,
        },
        data: {
          ...(dto.communityId !== undefined ? { communityId: dto.communityId } : {}),
          ...(dto.neighbourhoodId !== undefined ? { neighbourhoodId: dto.neighbourhoodId } : {}),
          ...(dto.caption !== undefined
            ? {
                caption: this.normaliseOptionalText(dto.caption),
                editedAt: new Date(),
              }
            : {}),
          ...(dto.status !== undefined
            ? {
                status: dto.status,
                publishedAt: publishing
                  ? new Date()
                  : dto.status === VibeStatus.PUBLISHED
                    ? existing.publishedAt
                    : null,
              }
            : {}),
          ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
          ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
          ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
          ...(dto.locationAccuracyM !== undefined
            ? { locationAccuracyM: dto.locationAccuracyM }
            : {}),
          ...(dto.postcode !== undefined
            ? { postcode: this.normaliseOptionalText(dto.postcode) }
            : {}),
        },
      });

      if (dto.mediaIds !== undefined) {
        await tx.vibeMedia.deleteMany({
          where: {
            vibeId,
          },
        });

        if (dto.mediaIds.length > 0) {
          await tx.vibeMedia.createMany({
            data: dto.mediaIds.map((mediaId, position) => ({
              vibeId,
              mediaId,
              position,
            })),
          });
        }
      }
    });

    return this.findOne(currentUserId, vibeId);
  }

  async softDelete(currentUserId: string, vibeId: string): Promise<void> {
    await this.requireOwnedVibe(currentUserId, vibeId);

    await this.database.vibe.update({
      where: {
        id: vibeId,
      },
      data: {
        status: VibeStatus.REMOVED,
        deletedAt: new Date(),
      },
    });
  }

  async findOne(currentUserId: string, vibeId: string): Promise<VibeResponse> {
    const vibe = await this.database.vibe.findFirst({
      where: {
        id: vibeId,
        deletedAt: null,
      },
      include: vibeInclude,
    });

    if (!vibe) {
      throw new NotFoundException('Vibe not found.');
    }

    if (!(await this.canViewVibe(currentUserId, vibe))) {
      throw new NotFoundException('Vibe not found.');
    }

    return this.toVibeResponse(vibe, await this.getEngagement(vibe.id, currentUserId));
  }

  async getFeed(currentUserId: string, query: VibeFeedQueryDto): Promise<VibeFeedResponse> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);

    const [communityMemberships, neighbourhoodMemberships, blocks, connections] = await Promise.all(
      [
        this.database.membership.findMany({
          where: {
            userId: currentUserId,
            status: MembershipStatus.ACTIVE,
          },
          select: {
            communityId: true,
          },
        }),

        this.database.neighbourhoodMembership.findMany({
          where: {
            userId: currentUserId,
          },
          select: {
            neighbourhoodId: true,
          },
        }),

        this.database.userBlock.findMany({
          where: {
            OR: [
              {
                blockerId: currentUserId,
              },
              {
                blockedId: currentUserId,
              },
            ],
          },
          select: {
            blockerId: true,
            blockedId: true,
          },
        }),

        this.database.connection.findMany({
          where: {
            status: 'CONNECTED',
            OR: [
              {
                userAId: currentUserId,
              },
              {
                userBId: currentUserId,
              },
            ],
          },
          select: {
            userAId: true,
            userBId: true,
          },
        }),
      ],
    );

    const communityIds = communityMemberships.map((membership) => membership.communityId);

    const neighbourhoodIds = neighbourhoodMemberships.map(
      (membership) => membership.neighbourhoodId,
    );

    const blockedUserIds = blocks.map((block) =>
      block.blockerId === currentUserId ? block.blockedId : block.blockerId,
    );

    const connectedUserIds = connections.map((connection) =>
      connection.userAId === currentUserId ? connection.userBId : connection.userAId,
    );

    const audienceFilters: Prisma.VibeWhereInput[] = [
      {
        visibility: VibeVisibility.PUBLIC,
      },
      {
        creatorId: currentUserId,
      },
    ];

    if (communityIds.length > 0) {
      audienceFilters.push({
        visibility: VibeVisibility.COMMUNITY,
        communityId: {
          in: communityIds,
        },
      });
    }

    if (neighbourhoodIds.length > 0) {
      audienceFilters.push({
        visibility: VibeVisibility.NEIGHBOURHOOD,
        neighbourhoodId: {
          in: neighbourhoodIds,
        },
      });
    }

    const creatorFilter: Prisma.StringFilter | undefined =
      blockedUserIds.length > 0 || query.mode === 'FOLLOWING'
        ? {
            ...(blockedUserIds.length > 0
              ? {
                  notIn: blockedUserIds,
                }
              : {}),
            ...(query.mode === 'FOLLOWING'
              ? {
                  in: connectedUserIds,
                }
              : {}),
          }
        : undefined;

    const feedWhere: Prisma.VibeWhereInput = {
      deletedAt: null,
      status: VibeStatus.PUBLISHED,

      ...(creatorFilter
        ? {
            creatorId: creatorFilter,
          }
        : {}),

      ...(query.communityId
        ? {
            communityId: query.communityId,
          }
        : {}),

      ...(query.neighbourhoodId
        ? {
            neighbourhoodId: query.neighbourhoodId,
          }
        : query.mode === 'NEARBY'
          ? {
              neighbourhoodId: {
                in: neighbourhoodIds,
              },
            }
          : {}),

      OR: audienceFilters,
    };

    const vibes: VibeWithRelations[] = await this.database.vibe.findMany({
      where: feedWhere,
      include: vibeInclude,

      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      take: limit + 1,

      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
    });

    const hasMore = vibes.length > limit;

    const page = hasMore ? vibes.slice(0, limit) : vibes;

    const lastItem = page.at(-1);

    const engagementMap = await this.getEngagementMap(
      page.map((vibe) => vibe.id),
      currentUserId,
    );

    return {
      items: page.map((vibe) =>
        this.toVibeResponse(vibe, engagementMap.get(vibe.id) ?? this.emptyEngagement()),
      ),

      nextCursor: hasMore && lastItem ? lastItem.id : null,
    };
  }

  async react(currentUserId: string, vibeId: string, dto: VibeReactionDto): Promise<VibeResponse> {
    await this.findOne(currentUserId, vibeId);

    await this.database.vibeReaction.upsert({
      where: {
        vibeId_userId: {
          vibeId,
          userId: currentUserId,
        },
      },
      create: {
        vibeId,
        userId: currentUserId,
        type: dto.type,
      },
      update: {
        type: dto.type,
      },
    });

    return this.findOne(currentUserId, vibeId);
  }

  async removeReaction(currentUserId: string, vibeId: string): Promise<void> {
    await this.findOne(currentUserId, vibeId);

    await this.database.vibeReaction.deleteMany({
      where: {
        vibeId,
        userId: currentUserId,
      },
    });
  }

  async addComment(
    currentUserId: string,
    vibeId: string,
    dto: CreateVibeCommentDto,
  ): Promise<VibeCommentResponse> {
    await this.findOne(currentUserId, vibeId);

    if (dto.parentId) {
      const parent = await this.database.vibeComment.findFirst({
        where: {
          id: dto.parentId,
          vibeId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        throw new BadRequestException('Parent comment does not belong to this vibe.');
      }
    }

    const comment = await this.database.vibeComment.create({
      data: {
        vibeId,
        authorId: currentUserId,
        parentId: dto.parentId ?? null,
        content: dto.content.trim(),
      },
      include: commentInclude,
    });

    return this.toCommentResponse(comment);
  }

  async listComments(currentUserId: string, vibeId: string): Promise<VibeCommentResponse[]> {
    await this.findOne(currentUserId, vibeId);

    const comments = await this.database.vibeComment.findMany({
      where: {
        vibeId,
        deletedAt: null,
      },
      include: commentInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return comments.map((comment) => this.toCommentResponse(comment));
  }

  async deleteComment(currentUserId: string, commentId: string): Promise<void> {
    const comment = await this.database.vibeComment.findFirst({
      where: {
        id: commentId,
        authorId: currentUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    await this.database.vibeComment.update({
      where: {
        id: commentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async save(currentUserId: string, vibeId: string): Promise<VibeSaveResponse> {
    await this.findOne(currentUserId, vibeId);

    await this.database.vibeSave.upsert({
      where: {
        vibeId_userId: {
          vibeId,
          userId: currentUserId,
        },
      },
      create: {
        vibeId,
        userId: currentUserId,
      },
      update: {},
    });

    return {
      saved: true,
    };
  }

  async unsave(currentUserId: string, vibeId: string): Promise<VibeSaveResponse> {
    await this.database.vibeSave.deleteMany({
      where: {
        vibeId,
        userId: currentUserId,
      },
    });

    return {
      saved: false,
    };
  }

  async recordView(
    currentUserId: string,
    vibeId: string,
    dto: RecordVibeViewDto,
  ): Promise<VibeViewReceiptResponse> {
    await this.findOne(currentUserId, vibeId);

    const created = await this.database.vibeView.create({
      data: {
        vibeId,
        userId: currentUserId,
        sessionKey: this.normaliseOptionalText(dto.sessionKey) ?? null,
        watchTimeMs: dto.watchTimeMs,
        ...(dto.completionRatio !== undefined ? { completionRatio: dto.completionRatio } : {}),
        completed: dto.completed ?? false,
        replay: dto.replay ?? false,
      },
      select: {
        id: true,
      },
    });

    return {
      id: created.id,
      recorded: true,
    };
  }

  private async requireOwnedVibe(currentUserId: string, vibeId: string) {
    const vibe = await this.database.vibe.findFirst({
      where: {
        id: vibeId,
        creatorId: currentUserId,
        deletedAt: null,
      },
    });

    if (!vibe) {
      throw new NotFoundException('Vibe not found.');
    }

    return vibe;
  }

  private async requireOwnedReadyMedia(currentUserId: string, mediaIds: string[]): Promise<void> {
    if (mediaIds.length === 0) {
      return;
    }

    const assets = await this.database.mediaAsset.findMany({
      where: {
        id: {
          in: mediaIds,
        },
        ownerId: currentUserId,
        status: 'READY',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (assets.length !== mediaIds.length) {
      throw new BadRequestException(
        'Every Vibe media asset must exist, be READY, and belong to the current user.',
      );
    }
  }

  private async validateAudience(
    currentUserId: string,
    communityId: string | null,
    neighbourhoodId: string | null,
    visibility: VibeVisibility,
  ): Promise<void> {
    if (visibility === VibeVisibility.COMMUNITY && !communityId) {
      throw new BadRequestException('COMMUNITY visibility requires communityId.');
    }

    if (visibility === VibeVisibility.NEIGHBOURHOOD && !neighbourhoodId) {
      throw new BadRequestException('NEIGHBOURHOOD visibility requires neighbourhoodId.');
    }

    if (communityId) {
      await this.requireCommunityMembership(currentUserId, communityId);
    }

    if (neighbourhoodId) {
      await this.requireNeighbourhoodMembership(currentUserId, neighbourhoodId);
    }
  }

  private async requireCommunityMembership(
    currentUserId: string,
    communityId: string,
  ): Promise<void> {
    const membership = await this.database.membership.findFirst({
      where: {
        userId: currentUserId,
        communityId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Active community membership is required.');
    }
  }

  private async requireNeighbourhoodMembership(
    currentUserId: string,
    neighbourhoodId: string,
  ): Promise<void> {
    const membership = await this.database.neighbourhoodMembership.findFirst({
      where: {
        userId: currentUserId,
        neighbourhoodId,
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Neighbourhood membership is required.');
    }
  }

  private async canViewVibe(
    currentUserId: string,
    vibe: {
      creatorId: string;
      status: VibeStatus;
      visibility: VibeVisibility;
      communityId: string | null;
      neighbourhoodId: string | null;
    },
  ): Promise<boolean> {
    if (vibe.creatorId === currentUserId) {
      return true;
    }

    if (vibe.status !== VibeStatus.PUBLISHED) {
      return false;
    }

    const blocked = await this.database.userBlock.findFirst({
      where: {
        OR: [
          {
            blockerId: currentUserId,
            blockedId: vibe.creatorId,
          },
          {
            blockerId: vibe.creatorId,
            blockedId: currentUserId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (blocked) {
      return false;
    }

    if (vibe.visibility === VibeVisibility.PUBLIC) {
      return true;
    }

    if (vibe.visibility === VibeVisibility.COMMUNITY && vibe.communityId) {
      const membership = await this.database.membership.findFirst({
        where: {
          userId: currentUserId,
          communityId: vibe.communityId,
          status: MembershipStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      return Boolean(membership);
    }

    if (vibe.visibility === VibeVisibility.NEIGHBOURHOOD && vibe.neighbourhoodId) {
      const membership = await this.database.neighbourhoodMembership.findFirst({
        where: {
          userId: currentUserId,
          neighbourhoodId: vibe.neighbourhoodId,
        },
        select: {
          id: true,
        },
      });

      return Boolean(membership);
    }

    return false;
  }

  private async getEngagement(
    vibeId: string,
    currentUserId: string,
  ): Promise<VibeEngagementResponse> {
    const map = await this.getEngagementMap([vibeId], currentUserId);

    return map.get(vibeId) ?? this.emptyEngagement();
  }

  private async getEngagementMap(
    vibeIds: string[],
    currentUserId: string,
  ): Promise<Map<string, VibeEngagementResponse>> {
    const map = new Map<string, VibeEngagementResponse>();

    if (vibeIds.length === 0) {
      return map;
    }

    for (const vibeId of vibeIds) {
      map.set(vibeId, this.emptyEngagement());
    }

    const [reactions, comments, saves, shares, views, myReactions, mySaves] = await Promise.all([
      this.database.vibeReaction.groupBy({
        by: ['vibeId'],
        where: {
          vibeId: {
            in: vibeIds,
          },
        },
        _count: {
          _all: true,
        },
      }),
      this.database.vibeComment.groupBy({
        by: ['vibeId'],
        where: {
          vibeId: {
            in: vibeIds,
          },
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.vibeSave.groupBy({
        by: ['vibeId'],
        where: {
          vibeId: {
            in: vibeIds,
          },
        },
        _count: {
          _all: true,
        },
      }),
      this.database.vibeShare.groupBy({
        by: ['vibeId'],
        where: {
          vibeId: {
            in: vibeIds,
          },
        },
        _count: {
          _all: true,
        },
      }),
      this.database.vibeView.groupBy({
        by: ['vibeId'],
        where: {
          vibeId: {
            in: vibeIds,
          },
        },
        _count: {
          _all: true,
        },
        _sum: {
          watchTimeMs: true,
        },
      }),
      this.database.vibeReaction.findMany({
        where: {
          vibeId: {
            in: vibeIds,
          },
          userId: currentUserId,
        },
        select: {
          vibeId: true,
          type: true,
        },
      }),
      this.database.vibeSave.findMany({
        where: {
          vibeId: {
            in: vibeIds,
          },
          userId: currentUserId,
        },
        select: {
          vibeId: true,
        },
      }),
    ]);

    for (const row of reactions) {
      const target = map.get(row.vibeId);

      if (target) {
        target.reactionCount = row._count._all;
      }
    }

    for (const row of comments) {
      const target = map.get(row.vibeId);

      if (target) {
        target.commentCount = row._count._all;
      }
    }

    for (const row of saves) {
      const target = map.get(row.vibeId);

      if (target) {
        target.saveCount = row._count._all;
      }
    }

    for (const row of shares) {
      const target = map.get(row.vibeId);

      if (target) {
        target.shareCount = row._count._all;
      }
    }

    for (const row of views) {
      const target = map.get(row.vibeId);

      if (target) {
        target.viewCount = row._count._all;
        target.totalWatchTimeMs = row._sum.watchTimeMs ?? 0;
      }
    }

    for (const row of myReactions) {
      const target = map.get(row.vibeId);

      if (target) {
        target.myReaction = row.type;
      }
    }

    for (const row of mySaves) {
      const target = map.get(row.vibeId);

      if (target) {
        target.savedByMe = true;
      }
    }

    return map;
  }

  private emptyEngagement(): VibeEngagementResponse {
    return {
      reactionCount: 0,
      commentCount: 0,
      saveCount: 0,
      shareCount: 0,
      viewCount: 0,
      totalWatchTimeMs: 0,
      myReaction: null,
      savedByMe: false,
    };
  }

  private toVibeResponse(
    vibe: VibeWithRelations,
    engagement: VibeEngagementResponse,
  ): VibeResponse {
    return {
      id: vibe.id,
      creatorId: vibe.creatorId,
      communityId: vibe.communityId,
      neighbourhoodId: vibe.neighbourhoodId,
      caption: vibe.caption,
      status: vibe.status,
      visibility: vibe.visibility,
      latitude: vibe.latitude === null ? null : Number(vibe.latitude),
      longitude: vibe.longitude === null ? null : Number(vibe.longitude),
      locationAccuracyM: vibe.locationAccuracyM,
      postcode: vibe.postcode,
      publishedAt: vibe.publishedAt?.toISOString() ?? null,
      editedAt: vibe.editedAt?.toISOString() ?? null,
      createdAt: vibe.createdAt.toISOString(),
      updatedAt: vibe.updatedAt.toISOString(),
      creator: {
        id: vibe.creator.id,
        displayName: vibe.creator.displayName,
        avatarUrl: vibe.creator.profile?.avatarUrl ?? null,
      },
      media: vibe.media.map((link) => ({
        id: link.id,
        mediaId: link.mediaId,
        position: link.position,
        publicUrl: link.media.publicUrl,
        mimeType: link.media.mimeType,
        width: link.media.width,
        height: link.media.height,
        durationMs: link.media.durationMs,
      })),
      engagement,
    };
  }

  private toCommentResponse(comment: CommentWithAuthor): VibeCommentResponse {
    return {
      id: comment.id,
      vibeId: comment.vibeId,
      authorId: comment.authorId,
      parentId: comment.parentId,
      content: comment.content,
      editedAt: comment.editedAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        displayName: comment.author.displayName,
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
      },
    };
  }

  private normaliseOptionalText(value: string | undefined): string | null {
    if (value === undefined) {
      return null;
    }

    const normalised = value.trim();

    return normalised.length > 0 ? normalised : null;
  }
}
