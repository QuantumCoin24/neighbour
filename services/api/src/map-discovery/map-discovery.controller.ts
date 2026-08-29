import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateMapDiscoveryDto } from './dto/create-map-discovery.dto';
import { UpdateMapDiscoveryDto } from './dto/update-map-discovery.dto';
import { MapDiscoveryService } from './map-discovery.service';

@Controller('map-discoveries')
export class MapDiscoveryController {
  constructor(private readonly mapDiscoveryService: MapDiscoveryService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMapDiscoveryDto) {
    return this.mapDiscoveryService.create(user.id, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.mapDiscoveryService.findMine(user.id);
  }

  @Get('profile/:username')
  findPublicProfile(@Param('username') username: string) {
    return this.mapDiscoveryService.findPublicProfile(username);
  }

  @Get('community/:communityId')
  findCommunity(
    @CurrentUser() user: AuthUser,
    @Param('communityId') communityId: string,
  ) {
    return this.mapDiscoveryService.findCommunity(user.id, communityId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMapDiscoveryDto,
  ) {
    return this.mapDiscoveryService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.mapDiscoveryService.remove(user.id, id);
  }
}
