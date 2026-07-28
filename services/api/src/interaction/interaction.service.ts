import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { Prisma, ReactionType } from '../generated/prisma/client';
import { PostService } from '../post/post.service';
import type { CommentQueryDto } from './dto/comment-query.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { SetReactionDto } from './dto/set-reaction.dto';
import type { UpdateCommentDto } from './dto/update-comment.dto';
import type {
  CommentFeedResponse,
  CommentResponse,
  ReactionResponse,
  ReactionSummaryResponse,
} from './interfaces/interaction-response.interface';

const commentInclude = {
  author: {
    include: {
      profile: true,
    },
  },
} satisfies Prisma.CommentInclude;

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

@Injectable()
export class InteractionService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
    private readonly postService: PostService,
  ) {}

  async createComment(
    currentUserId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    await this.postService.findOne(currentUserId, postId);

    if (dto.parentId) {
      const parent = await this.database.comment.findFirst({
        where: {
          id: dto.parentId,
          postId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found.');
      }
    }

    const data: Prisma.CommentUncheckedCreateInput = {
      postId,
      authorId: currentUserId,
      parentId: dto.parentId ?? null,
      content: dto.content.trim(),
    };

    const created = await this.database.comment.create({
      data,
      select: {
        id: true,
      },
    });

    return this.requireCommentWithAuthor(created.id);
  }

  async listComments(
    currentUserId: string,
    postId: string,
    query: CommentQueryDto,
  ): Promise<CommentFeedResponse> {
    await this.postService.findOne(currentUserId, postId);

    const comments = await this.database.comment.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      include: commentInclude,
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
    });

    const hasMore = comments.length > query.limit;
    const items = hasMore ? comments.slice(0, query.limit) : comments;

    return {
      items: items.map((comment) => this.toCommentResponse(comment)),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async updateComment(
    currentUserId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    await this.requireOwnedComment(currentUserId, commentId);

    await this.database.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: dto.content.trim(),
        editedAt: new Date(),
      },
    });

    return this.requireCommentWithAuthor(commentId);
  }

  async deleteComment(currentUserId: string, commentId: string): Promise<void> {
    await this.requireOwnedComment(currentUserId, commentId);

    await this.database.comment.update({
      where: {
        id: commentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async setReaction(
    currentUserId: string,
    postId: string,
    dto: SetReactionDto,
  ): Promise<ReactionResponse> {
    await this.postService.findOne(currentUserId, postId);

    const reaction = await this.database.postReaction.upsert({
      where: {
        postId_userId: {
          postId,
          userId: currentUserId,
        },
      },
      create: {
        postId,
        userId: currentUserId,
        type: dto.type,
      },
      update: {
        type: dto.type,
      },
    });

    return {
      postId: reaction.postId,
      type: reaction.type,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    };
  }

  async removeReaction(currentUserId: string, postId: string): Promise<void> {
    await this.postService.findOne(currentUserId, postId);

    await this.database.postReaction.deleteMany({
      where: {
        postId,
        userId: currentUserId,
      },
    });
  }

  async getReactionSummary(
    currentUserId: string,
    postId: string,
  ): Promise<ReactionSummaryResponse> {
    await this.postService.findOne(currentUserId, postId);

    const [groups, viewerReaction] = await Promise.all([
      this.database.postReaction.groupBy({
        by: ['type'],
        where: {
          postId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.postReaction.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUserId,
          },
        },
        select: {
          type: true,
        },
      }),
    ]);

    const countMap = new Map(groups.map((group) => [group.type, group._count._all]));

    const counts = Object.values(ReactionType).map((type) => ({
      type,
      count: countMap.get(type) ?? 0,
    }));

    return {
      counts,
      total: counts.reduce((total, entry) => total + entry.count, 0),
      viewerReaction: viewerReaction?.type ?? null,
    };
  }

  private async requireOwnedComment(currentUserId: string, commentId: string): Promise<void> {
    const comment = await this.database.comment.findFirst({
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
  }

  private async requireCommentWithAuthor(commentId: string): Promise<CommentResponse> {
    const comment = await this.database.comment.findUnique({
      where: {
        id: commentId,
      },
      include: commentInclude,
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found.');
    }

    return this.toCommentResponse(comment);
  }

  private toCommentResponse(comment: CommentWithAuthor): CommentResponse {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.content,
      author: {
        id: comment.author.id,
        displayName: comment.author.displayName,
        username: comment.author.profile?.username ?? null,
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
      },
      editedAt: comment.editedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
