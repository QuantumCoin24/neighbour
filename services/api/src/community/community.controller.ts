import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import type {
  CommunityMembershipResponse,
  CommunitySummary,
} from './interfaces/community-response.interface';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCommunityDto,
  ): Promise<CommunitySummary> {
    return this.communityService.create(user.id, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser): Promise<CommunityMembershipResponse[]> {
    return this.communityService.findMine(user.id);
  }

  @Public()
  @Get()
  findPublic(): Promise<CommunitySummary[]> {
    return this.communityService.findPublic();
  }

  @Post(':slug/join')
  join(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
  ): Promise<CommunityMembershipResponse> {
    return this.communityService.join(user.id, slug);
  }

  @Public()
  @Get(':slug')
  findPublicBySlug(@Param('slug') slug: string): Promise<CommunitySummary> {
    return this.communityService.findPublicBySlug(slug);
  }
}
