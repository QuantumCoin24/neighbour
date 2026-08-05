import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MediaAssetService } from './assets/media-asset.service';
import { AttachPostMediaDto } from './dto/attach-post-media.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateUploadDto } from './dto/create-upload.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaAssetService) {}

  @Post('uploads')
  createUpload(@CurrentUser() user: AuthUser, @Body() dto: CreateUploadDto) {
    return this.mediaService.createUpload(user.id, dto);
  }

  @Post(':id/complete')
  completeUpload(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.mediaService.completeUpload(user.id, id, dto);
  }

  @Get('mine')
  getMine(@CurrentUser() user: AuthUser) {
    return this.mediaService.findMine(user.id);
  }

  @Put('posts/:postId')
  attachToPost(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: AttachPostMediaDto,
  ) {
    return this.mediaService.attachToPost(user.id, postId, dto.mediaIds);
  }

  @Get('posts/:postId')
  getPostMedia(@Param('postId') postId: string) {
    return this.mediaService.getPostMedia(postId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    return this.mediaService.remove(user.id, id);
  }
}
