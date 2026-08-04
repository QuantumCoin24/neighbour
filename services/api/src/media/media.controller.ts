import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

import { CreateMediaDto } from './dto/create-media.dto';
import { MediaAssetService } from './assets/media-asset.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaAssetService) {}

  @Get('mine')
  getMine(@CurrentUser() user: AuthUser) {
    return this.mediaService.findByOwner(user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.mediaService.findById(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMediaDto) {
    return this.mediaService.create({
      id: crypto.randomUUID(),
      ownerId: user.id,
      ownerType: dto.ownerType,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      size: dto.size,
      url: dto.url,
      createdAt: new Date(),
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
