import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { SearchCommunityDto } from './dto/search-community.dto';
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
  findPublic(@Query() query: SearchCommunityDto): Promise<CommunitySummary[]> {
    return this.communityService.findPublic(query);
  }

  @Post(':slug/join')
  join(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
  ): Promise<CommunityMembershipResponse> {
    return this.communityService.join(user.id, slug);
  }

  @Delete(':slug/leave')
  leave(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
  ): Promise<{ left: true; communityId: string }> {
    return this.communityService.leave(user.id, slug);
  }

  @Public()
  @Get(':slug')
  findPublicBySlug(@Param('slug') slug: string): Promise<CommunitySummary> {
    return this.communityService.findPublicBySlug(slug);
  }
}
