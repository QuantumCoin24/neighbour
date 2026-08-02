import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MembershipStatus, PostStatus, PostVisibility, Prisma } from '../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import type { CreatePostDto } from './dto/create-post.dto';
import type { FeedQueryDto } from './dto/feed-query.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import type { FeedResponse, PostResponse } from './interfaces/post-response.interface';
import { createCursorPagination, extractPage } from './utils/feed-pagination.util';

const postInclude = {
  author: {
    include: {
      profile: true,
    },
  },
  community: true,
  neighbourhood: true,
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postInclude;
}>;

@Injectable()
export class PostService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(currentUserId: string, dto: CreatePostDto): Promise<PostResponse> {
    const status = dto.status ?? 'PUBLISHED';
    const visibility = this.resolveVisibility(dto.visibility, dto.communityId);

    if (dto.communityId) {
      await this.requireActiveCommunityMembership(currentUserId, dto.communityId);
    }

    this.validateCommunityVisibility(dto.communityId ?? null, visibility);

    const data: Prisma.PostUncheckedCreateInput = {
      authorId: currentUserId,
      communityId: dto.communityId ?? null,
      neighbourhoodId: dto.neighbourhoodId ?? null,
      title: this.normaliseOptionalText(dto.title),
      content: dto.content.trim(),
      status,
      visibility,
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
    };

    const createdPost = await this.database.post.create({
      data,
      select: {
        id: true,
      },
    });

    const post = await this.requirePostWithRelations(createdPost.id);

    return this.toPostResponse(post);
  }

  async update(currentUserId: string, postId: string, dto: UpdatePostDto): Promise<PostResponse> {
    const existing = await this.requireOwnedPost(currentUserId, postId);

    const nextCommunityId = dto.communityId === undefined ? existing.communityId : dto.communityId;

    const nextVisibility = this.resolveVisibility(
      dto.visibility ?? existing.visibility,
      nextCommunityId ?? undefined,
    );

    if (nextCommunityId) {
      await this.requireActiveCommunityMembership(currentUserId, nextCommunityId);
    }

    this.validateCommunityVisibility(nextCommunityId, nextVisibility);

    const nextStatus = dto.status ?? existing.status;
    const isPublishing =
      existing.status !== PostStatus.PUBLISHED && nextStatus === PostStatus.PUBLISHED;

    const contentChanged = dto.content !== undefined && dto.content.trim() !== existing.content;

    const titleChanged =
      dto.title !== undefined && this.normaliseOptionalText(dto.title) !== existing.title;

    const placementChanged = dto.communityId !== undefined || dto.visibility !== undefined;

    const data: Prisma.PostUncheckedUpdateInput = {
      publishedAt: isPublishing
        ? new Date()
        : nextStatus === PostStatus.DRAFT
          ? null
          : existing.publishedAt,
      editedAt: contentChanged || titleChanged || placementChanged ? new Date() : existing.editedAt,
    };

    if (dto.title !== undefined) {
      data.title = this.normaliseOptionalText(dto.title);
    }

    if (dto.content !== undefined) {
      data.content = dto.content.trim();
    }

    if (dto.communityId !== undefined) {
      data.communityId = dto.communityId;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.visibility !== undefined || placementChanged) {
      data.visibility = nextVisibility;
    }

    await this.database.post.update({
      where: {
        id: postId,
      },
      data,
    });

    const post = await this.requirePostWithRelations(postId);

    return this.toPostResponse(post);
  }

  async softDelete(currentUserId: string, postId: string): Promise<void> {
    await this.requireOwnedPost(currentUserId, postId);

    await this.database.post.update({
      where: {
        id: postId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findOne(currentUserId: string, postId: string): Promise<PostResponse> {
    const post = await this.database.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: postInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const canView = await this.canViewPost(currentUserId, post);

    if (!canView) {
      throw new NotFoundException('Post not found.');
    }

    return this.toPostResponse(post);
  }

  async getHomeFeed(currentUserId: string, query: FeedQueryDto): Promise<FeedResponse> {
    const [connections, memberships, neighbourhoodMemberships] = await Promise.all([
      this.database.connection.findMany({
        where: {
          status: 'CONNECTED',
          OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
        },
        select: {
          userAId: true,
          userBId: true,
        },
      }),
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
    ]);

    const connectedUserIds = connections.map((connection) =>
      connection.userAId === currentUserId ? connection.userBId : connection.userAId,
    );

    const communityIds = memberships.map((membership) => membership.communityId);

    const neighbourhoodIds = neighbourhoodMemberships.map(
      (membership) => membership.neighbourhoodId,
    );

    const pagination = createCursorPagination(query);

    const visibilityFilters: Prisma.PostWhereInput[] = [
      {
        authorId: currentUserId,
      },
      {
        visibility: PostVisibility.PUBLIC,
      },
    ];

    if (connectedUserIds.length > 0) {
      visibilityFilters.push({
        visibility: PostVisibility.CONNECTIONS,
        authorId: {
          in: connectedUserIds,
        },
      });
    }

    if (communityIds.length > 0) {
      visibilityFilters.push({
        visibility: PostVisibility.COMMUNITY,
        communityId: {
          in: communityIds,
        },
      });
    }

    if (neighbourhoodIds.length > 0) {
      visibilityFilters.push({
        neighbourhoodId: {
          in: neighbourhoodIds,
        },
      });
    }

    const posts = await this.database.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        OR: visibilityFilters,
      },
      include: postInclude,
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  async getCommunityFeed(
    currentUserId: string,
    communitySlug: string,
    query: FeedQueryDto,
  ): Promise<FeedResponse> {
    const community = await this.database.community.findUnique({
      where: {
        slug: communitySlug.toLowerCase(),
      },
      select: {
        id: true,
        visibility: true,
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const membership = await this.database.membership.findUnique({
      where: {
        userId_communityId: {
          userId: currentUserId,
          communityId: community.id,
        },
      },
      select: {
        status: true,
      },
    });

    const isActiveMember = membership?.status === MembershipStatus.ACTIVE;

    if (community.visibility === 'PRIVATE' && !isActiveMember) {
      throw new ForbiddenException('You must be an active member to view this community feed.');
    }

    const pagination = createCursorPagination(query);

    const posts = await this.database.post.findMany({
      where: {
        communityId: community.id,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        OR: [
          {
            visibility: PostVisibility.PUBLIC,
          },
          ...(isActiveMember
            ? [
                {
                  visibility: PostVisibility.COMMUNITY,
                },
              ]
            : []),
          {
            authorId: currentUserId,
          },
        ],
      },
      include: postInclude,
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  async getProfilePosts(
    currentUserId: string,
    username: string,
    query: FeedQueryDto,
  ): Promise<FeedResponse> {
    const profile = await this.database.userProfile.findUnique({
      where: {
        username: username.toLowerCase(),
      },
      select: {
        userId: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const isOwner = profile.userId === currentUserId;

    const relationship = isOwner
      ? null
      : await this.database.connection.findFirst({
          where: {
            status: 'CONNECTED',
            OR: [
              {
                userAId: currentUserId,
                userBId: profile.userId,
              },
              {
                userAId: profile.userId,
                userBId: currentUserId,
              },
            ],
          },
          select: {
            id: true,
          },
        });

    const pagination = createCursorPagination(query);

    const visibilityFilters: Prisma.PostWhereInput[] = [
      {
        visibility: PostVisibility.PUBLIC,
      },
    ];

    if (isOwner) {
      visibilityFilters.push({
        authorId: currentUserId,
      });
    } else if (relationship) {
      visibilityFilters.push({
        visibility: PostVisibility.CONNECTIONS,
      });
    }

    const posts = await this.database.post.findMany({
      where: {
        authorId: profile.userId,
        deletedAt: null,
        ...(isOwner
          ? {}
          : {
              status: PostStatus.PUBLISHED,
            }),
        OR: visibilityFilters,
      },
      include: postInclude,
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
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  async getMyDrafts(currentUserId: string, query: FeedQueryDto): Promise<FeedResponse> {
    const pagination = createCursorPagination(query);

    const posts = await this.database.post.findMany({
      where: {
        authorId: currentUserId,
        status: PostStatus.DRAFT,
        deletedAt: null,
      },
      include: postInclude,
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  private async canViewPost(currentUserId: string, post: PostWithRelations): Promise<boolean> {
    if (post.authorId === currentUserId) {
      return true;
    }

    if (post.status !== PostStatus.PUBLISHED) {
      return false;
    }

    if (post.visibility === PostVisibility.PUBLIC) {
      return true;
    }

    if (post.visibility === PostVisibility.PRIVATE) {
      return false;
    }

    if (post.visibility === PostVisibility.CONNECTIONS) {
      const connection = await this.database.connection.findFirst({
        where: {
          status: 'CONNECTED',
          OR: [
            {
              userAId: currentUserId,
              userBId: post.authorId,
            },
            {
              userAId: post.authorId,
              userBId: currentUserId,
            },
          ],
        },
        select: {
          id: true,
        },
      });

      return Boolean(connection);
    }

    if (post.visibility === PostVisibility.COMMUNITY && post.communityId) {
      const membership = await this.database.membership.findUnique({
        where: {
          userId_communityId: {
            userId: currentUserId,
            communityId: post.communityId,
          },
        },
        select: {
          status: true,
        },
      });

      return membership?.status === MembershipStatus.ACTIVE;
    }

    return false;
  }

  private async requirePostWithRelations(postId: string): Promise<PostWithRelations> {
    const post = await this.database.post.findUnique({
      where: {
        id: postId,
      },
      include: postInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  private async requireOwnedPost(currentUserId: string, postId: string) {
    const post = await this.database.post.findFirst({
      where: {
        id: postId,
        authorId: currentUserId,
        deletedAt: null,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  private async requireActiveCommunityMembership(
    userId: string,
    communityId: string,
  ): Promise<void> {
    const membership = await this.database.membership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      select: {
        status: true,
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('You must be an active community member to post there.');
    }
  }

  private resolveVisibility(
    requestedVisibility: 'PUBLIC' | 'CONNECTIONS' | 'COMMUNITY' | 'PRIVATE' | undefined,
    communityId: string | undefined,
  ): PostVisibility {
    if (requestedVisibility) {
      return requestedVisibility as PostVisibility;
    }

    return communityId ? PostVisibility.COMMUNITY : PostVisibility.PUBLIC;
  }

  private validateCommunityVisibility(
    communityId: string | null,
    visibility: PostVisibility,
  ): void {
    if (visibility === PostVisibility.COMMUNITY && !communityId) {
      throw new BadRequestException('Community visibility requires a community.');
    }

    if (communityId && visibility === PostVisibility.CONNECTIONS) {
      throw new BadRequestException('Community posts cannot use connections-only visibility.');
    }

    if (communityId && visibility === PostVisibility.PRIVATE) {
      throw new BadRequestException('Private drafts should not be attached to a community.');
    }
  }

  private normaliseOptionalText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  private toFeedResponse(posts: PostWithRelations[], limit: number): FeedResponse {
    const page = extractPage(posts, limit);

    return {
      items: page.items.map((post) => this.toPostResponse(post)),
      nextCursor: page.nextCursor,
    };
  }

  private toPostResponse(post: PostWithRelations): PostResponse {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      visibility: post.visibility,
      author: {
        id: post.author.id,
        displayName: post.author.displayName,
        username: post.author.profile?.username ?? null,
        avatarUrl: post.author.profile?.avatarUrl ?? null,
        localArea:
          post.author.profile?.showLocalArea === true ? post.author.profile.localArea : null,
      },
      community: post.community
        ? {
            id: post.community.id,
            name: post.community.name,
            slug: post.community.slug,
          }
        : null,
      neighbourhood: post.neighbourhood
        ? {
            id: post.neighbourhood.id,
            name: post.neighbourhood.name,
            localArea: post.neighbourhood.localArea,
          }
        : null,
      publishedAt: post.publishedAt,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
