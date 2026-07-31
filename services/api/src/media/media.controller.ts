import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

import { MediaAssetService } from './assets/media-asset.service';


@Controller('media')
export class MediaController {

  constructor(
    private readonly mediaService: MediaAssetService,
  ) {}


  @Get('mine')
  getMine(
    @CurrentUser() user: AuthUser,
  ) {

    return this.mediaService.findByOwner(
      user.id,
    );

  }


}
