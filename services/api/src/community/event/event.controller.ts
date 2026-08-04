import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

import { CreateEventDto } from './dto/create-event.dto';
import { EventService } from './event.service';

@Controller('communities')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post(':communityId/events')
  create(
    @CurrentUser() user: AuthUser,
    @Param('communityId') communityId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventService.create({
      id: crypto.randomUUID(),
      communityId,
      creatorId: user.id,
      title: dto.title,
      description: dto.description,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      createdAt: new Date(),
    });
  }

  @Get(':communityId/events')
  findCommunityEvents(@Param('communityId') communityId: string) {
    return this.eventService.findCommunityEvents(communityId);
  }

  @Get('/events/:id')
  findOne(@Param('id') id: string) {
    return this.eventService.findById(id);
  }

  @Delete('/events/:id')
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
