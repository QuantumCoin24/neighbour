import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import type {
  CommentFeedResponse,
  CommentResponse,
  ReactionResponse,
  ReactionSummaryResponse,
} from './interfaces/interaction-response.interface';
import { InteractionService } from './interaction.service';

@Controller()
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post('posts/:postId/comments')
  createComment(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    return this.interactionService.createComment(user.id, postId, dto);
  }

  @Get('posts/:postId/comments')
  listComments(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Query() query: CommentQueryDto,
  ): Promise<CommentFeedResponse> {
    return this.interactionService.listComments(user.id, postId, query);
  }

  @Patch('comments/:commentId')
  updateComment(
    @CurrentUser() user: AuthUser,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    return this.interactionService.updateComment(user.id, commentId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('comments/:commentId')
  deleteComment(
    @CurrentUser() user: AuthUser,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.interactionService.deleteComment(user.id, commentId);
  }

  @Put('posts/:postId/reaction')
  setReaction(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: SetReactionDto,
  ): Promise<ReactionResponse> {
    return this.interactionService.setReaction(user.id, postId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('posts/:postId/reaction')
  removeReaction(@CurrentUser() user: AuthUser, @Param('postId') postId: string): Promise<void> {
    return this.interactionService.removeReaction(user.id, postId);
  }

  @Get('posts/:postId/reactions')
  getReactionSummary(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
  ): Promise<ReactionSummaryResponse> {
    return this.interactionService.getReactionSummary(user.id, postId);
  }
}
