import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';

import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

import { BusinessService } from './business.service';

@Controller('businesses')
export class BusinessController {
  constructor(private readonly service: BusinessService) {}

  @Get('community/:communityId')
  findCommunityBusinesses(
    @Param('communityId')
    communityId: string,
  ) {
    return this.service.findCommunityBusinesses(communityId);
  }

  @Get('me')
  findMyBusiness(
    @CurrentUser()
    user: AuthUser,
  ) {
    return this.service.findByOwner(user.id);
  }

  @Get('search')
  search(
    @Query('q')
    query: string,
  ) {
    return this.service.search(query ?? '');
  }

  @Post()
  create(
    @CurrentUser()
    user: AuthUser,

    @Body()
    body: {
      communityId: string;
      name: string;
      description: string;
      category: string;
    },
  ) {
    return this.service.create(user.id, {
      id: crypto.randomUUID(),
      communityId: body.communityId,
      ownerId: user.id,
      name: body.name,
      description: body.description,
      category: body.category,
      createdAt: new Date(),
    });
  }
}
