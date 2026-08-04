import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  PrivateProfileResponse,
  PublicProfileResponse,
} from './interfaces/profile-response.interface';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProfileDto) {
    return this.profileService.create({
      id: crypto.randomUUID(),
      userId: user.id,
      username: dto.username,
      displayName: user.displayName,
      ...(dto.bio ? { bio: dto.bio } : {}),
      localArea: dto.localArea ?? null,
      showLocalArea: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
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
