import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AdventureService } from './adventure.service';
import { CreateAdventureDto } from './dto/create-adventure.dto';
import { UpdateAdventureDto } from './dto/update-adventure.dto';

@Controller('adventures')
export class AdventureController {
  constructor(private readonly adventureService: AdventureService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAdventureDto) {
    return this.adventureService.create(user.id, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.adventureService.findMine(user.id);
  }

  @Get('profile/:username')
  findPublicProfile(@Param('username') username: string) {
    return this.adventureService.findPublicProfile(username);
  }

  @Get('community/:communityId')
  findCommunity(@CurrentUser() user: AuthUser, @Param('communityId') communityId: string) {
    return this.adventureService.findCommunity(user.id, communityId);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAdventureDto) {
    return this.adventureService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adventureService.remove(user.id, id);
  }
}
