import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import type {
  NotificationFeedResponse,
  NotificationResponse,
} from './interfaces/notification-response.interface';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getInbox(
    @CurrentUser() user: AuthUser,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationFeedResponse> {
    return this.notificationService.getInbox(user.id, query);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthUser): Promise<{ unreadCount: number }> {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser): Promise<{ updatedCount: number }> {
    return this.notificationService.markAllRead(user.id);
  }

  @Patch(':notificationId/read')
  markRead(
    @CurrentUser() user: AuthUser,
    @Param('notificationId') notificationId: string,
  ): Promise<NotificationResponse> {
    return this.notificationService.markRead(user.id, notificationId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':notificationId')
  dismiss(
    @CurrentUser() user: AuthUser,
    @Param('notificationId') notificationId: string,
  ): Promise<void> {
    return this.notificationService.dismiss(user.id, notificationId);
  }
}
