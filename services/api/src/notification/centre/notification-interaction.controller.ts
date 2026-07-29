import { Controller, Patch, Param } from '@nestjs/common';

import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationInteractionController {
  constructor(private readonly service: NotificationService) {}

  @Patch(':userId/read-all')
  readAll(@Param('userId') userId: string) {
    return this.service.markAllRead(userId);
  }
}
