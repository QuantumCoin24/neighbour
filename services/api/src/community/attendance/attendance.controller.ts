import { Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

import { AttendanceService } from './attendance.service';

@Controller('events')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post(':eventId/attendance')
  join(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string) {
    return this.attendanceService.join({
      id: crypto.randomUUID(),
      eventId,
      userId: user.id,
      createdAt: new Date(),
    });
  }

  @Get(':eventId/attendance')
  list(@Param('eventId') eventId: string) {
    return this.attendanceService.list(eventId);
  }

  @Delete(':eventId/attendance')
  leave(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string) {
    return this.attendanceService.leave(eventId, user.id);
  }
}
