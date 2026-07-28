import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  PrivateProfileResponse,
  PublicProfileResponse,
} from './interfaces/profile-response.interface';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthUser): Promise<PrivateProfileResponse> {
    return this.profileService.findMine(user.id);
  }

  @Patch('me')
  updateMine(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<PrivateProfileResponse> {
    return this.profileService.updateMine(user.id, dto);
  }

  @Public()
  @Get(':username')
  findPublicByUsername(@Param('username') username: string): Promise<PublicProfileResponse> {
    return this.profileService.findPublicByUsername(username);
  }
}
