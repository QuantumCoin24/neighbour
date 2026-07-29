import { Controller, Get, Param, Patch } from '@nestjs/common';

import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get(':userId')
  list(@Param('userId') userId: string) {
    return this.service.listForUser(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }
}
