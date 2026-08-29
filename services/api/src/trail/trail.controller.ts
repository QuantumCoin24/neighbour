import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateTrailDto } from './dto/create-trail.dto';
import { UpdateTrailDto } from './dto/update-trail.dto';
import { TrailService } from './trail.service';

@Controller('trails')
export class TrailController {
  constructor(private readonly trailService: TrailService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTrailDto) {
    return this.trailService.create(user.id, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.trailService.findMine(user.id);
  }

  @Get('profile/:username')
  findPublicProfile(@Param('username') username: string) {
    return this.trailService.findPublicProfile(username);
  }

  @Get('community/:communityId')
  findCommunity(@CurrentUser() user: AuthUser, @Param('communityId') communityId: string) {
    return this.trailService.findCommunity(user.id, communityId);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTrailDto) {
    return this.trailService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.trailService.remove(user.id, id);
  }
}
