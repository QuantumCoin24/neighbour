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
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

import { CreateVibeCommentDto } from './dto/create-vibe-comment.dto';
import { CreateVibeDto } from './dto/create-vibe.dto';
import { RecordVibeViewDto } from './dto/record-vibe-view.dto';
import { UpdateVibeDto } from './dto/update-vibe.dto';
import { VibeFeedQueryDto } from './dto/vibe-feed-query.dto';
import { VibeReactionDto } from './dto/vibe-reaction.dto';
import type {
  VibeCommentResponse,
  VibeFeedResponse,
  VibeResponse,
  VibeSaveResponse,
  VibeViewReceiptResponse,
} from './interfaces/vibe-response.interface';
import { VibesService } from './vibes.service';

@Controller('vibes')
export class VibesController {
  constructor(
    private readonly vibesService: VibesService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateVibeDto,
  ): Promise<VibeResponse> {
    return this.vibesService.create(user.id, dto);
  }

  @Get('feed')
  getFeed(
    @CurrentUser() user: AuthUser,
    @Query() query: VibeFeedQueryDto,
  ): Promise<VibeFeedResponse> {
    return this.vibesService.getFeed(user.id, query);
  }

  @Get(':vibeId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
  ): Promise<VibeResponse> {
    return this.vibesService.findOne(user.id, vibeId);
  }

  @Patch(':vibeId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
    @Body() dto: UpdateVibeDto,
  ): Promise<VibeResponse> {
    return this.vibesService.update(user.id, vibeId, dto);
  }

  @Delete(':vibeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
  ): Promise<void> {
    await this.vibesService.softDelete(user.id, vibeId);
  }

  @Post(':vibeId/reaction')
  react(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
    @Body() dto: VibeReactionDto,
  ): Promise<VibeResponse> {
    return this.vibesService.react(user.id, vibeId, dto);
  }

  @Delete(':vibeId/reaction')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
  ): Promise<void> {
    await this.vibesService.removeReaction(user.id, vibeId);
  }

  @Get(':vibeId/comments')
  listComments(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
  ): Promise<VibeCommentResponse[]> {
    return this.vibesService.listComments(user.id, vibeId);
  }

  @Post(':vibeId/comments')
  addComment(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
    @Body() dto: CreateVibeCommentDto,
  ): Promise<VibeCommentResponse> {
    return this.vibesService.addComment(
      user.id,
      vibeId,
      dto,
    );
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @CurrentUser() user: AuthUser,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    await this.vibesService.deleteComment(
      user.id,
      commentId,
    );
  }

  @Post(':vibeId/save')
  save(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
  ): Promise<VibeSaveResponse> {
    return this.vibesService.save(user.id, vibeId);
  }

  @Delete(':vibeId/save')
  unsave(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
  ): Promise<VibeSaveResponse> {
    return this.vibesService.unsave(user.id, vibeId);
  }

  @Post(':vibeId/views')
  recordView(
    @CurrentUser() user: AuthUser,
    @Param('vibeId') vibeId: string,
    @Body() dto: RecordVibeViewDto,
  ): Promise<VibeViewReceiptResponse> {
    return this.vibesService.recordView(
      user.id,
      vibeId,
      dto,
    );
  }
}
