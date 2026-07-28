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
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import type { FeedResponse, PostResponse } from './interfaces/post-response.interface';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto): Promise<PostResponse> {
    return this.postService.create(user.id, dto);
  }

  @Get('drafts')
  getMyDrafts(@CurrentUser() user: AuthUser, @Query() query: FeedQueryDto): Promise<FeedResponse> {
    return this.postService.getMyDrafts(user.id, query);
  }

  @Get(':postId')
  findOne(@CurrentUser() user: AuthUser, @Param('postId') postId: string): Promise<PostResponse> {
    return this.postService.findOne(user.id, postId);
  }

  @Patch(':postId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponse> {
    return this.postService.update(user.id, postId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':postId')
  softDelete(@CurrentUser() user: AuthUser, @Param('postId') postId: string): Promise<void> {
    return this.postService.softDelete(user.id, postId);
  }
}
