import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import type { LiveAccessResponse, LiveSessionResponse } from './interfaces/live-response.interface';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Post('sessions')
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateLiveSessionDto,
  ): Promise<LiveSessionResponse> {
    return this.liveService.create(user.id, dto);
  }

  @Get('sessions/active')
  active(@CurrentUser() user: { id: string }): Promise<LiveSessionResponse[]> {
    return this.liveService.active(user.id);
  }

  @Get('sessions/:liveSessionId')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('liveSessionId') liveSessionId: string,
  ): Promise<LiveSessionResponse> {
    return this.liveService.findOne(user.id, liveSessionId);
  }

  @Post('sessions/:liveSessionId/access')
  access(
    @CurrentUser() user: { id: string },
    @Param('liveSessionId') liveSessionId: string,
  ): Promise<LiveAccessResponse> {
    return this.liveService.access(user.id, liveSessionId);
  }

  @Post('sessions/:liveSessionId/start')
  start(
    @CurrentUser() user: { id: string },
    @Param('liveSessionId') liveSessionId: string,
  ): Promise<LiveSessionResponse> {
    return this.liveService.markLive(user.id, liveSessionId);
  }

  @Post('sessions/:liveSessionId/leave')
  async leave(
    @CurrentUser() user: { id: string },
    @Param('liveSessionId') liveSessionId: string,
  ): Promise<void> {
    await this.liveService.leave(user.id, liveSessionId);
  }

  @Post('sessions/:liveSessionId/end')
  end(
    @CurrentUser() user: { id: string },
    @Param('liveSessionId') liveSessionId: string,
  ): Promise<LiveSessionResponse> {
    return this.liveService.end(user.id, liveSessionId);
  }
}
