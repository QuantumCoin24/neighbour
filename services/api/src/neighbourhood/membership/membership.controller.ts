import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';

import { MembershipService } from './membership.service';

@Controller('memberships')
export class MembershipController {
  constructor(private readonly service: MembershipService) {}

  @Post('join')
  async join(@Req() req: any, @Body() body: { neighbourhoodId: string }) {
    if (!req.user?.id) {
      throw new Error('No authenticated user found');
    }

    if (!body?.neighbourhoodId) {
      throw new Error('No neighbourhoodId supplied');
    }

    return this.service.join({
      id: crypto.randomUUID(),
      userId: req.user.id,
      neighbourhoodId: body.neighbourhoodId,
      createdAt: new Date(),
    });
  }

  @Get('me')
  findMine(@Req() req: any) {
    return this.service.findUserMemberships(req.user.id);
  }

  @Get(':neighbourhoodId/members')
  findMembers(@Param('neighbourhoodId') neighbourhoodId: string) {
    return this.service.findMembers(neighbourhoodId);
  }
}
