import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';
import { RestoreApplePurchasesDto } from '../dto/restore-apple-purchases.dto';
import { VerifyAppleTransactionDto } from '../dto/verify-apple-transaction.dto';
import { AppleCommerceService } from '../services/apple-commerce.service';

import { AppleServerNotificationDto } from '../dto/apple-server-notification.dto';
import { AppleServerNotificationService } from '../notifications/apple-server-notification.service';

@Controller('apple-commerce')
export class AppleCommerceController {
  constructor(
    private readonly commerce: AppleCommerceService,
    private readonly notifications: AppleServerNotificationService,
  ) {}

  @Get('health')
  health() {
    return this.commerce.health();
  }

  @Get('products')
  products() {
    return this.commerce.listProducts();
  }

  @Post('verify')
  verify(
    @CurrentUser()
    user: AuthUser,
    @Body()
    dto: VerifyAppleTransactionDto,
  ) {
    return this.commerce.verifyAndSync(user.id, dto.signedTransactionInfo);
  }

  @Post('restore')
  restore(
    @CurrentUser()
    user: AuthUser,
    @Body()
    dto: RestoreApplePurchasesDto,
  ) {
    return this.commerce.restore(user.id, dto.signedTransactions);
  }

  @Post('notifications')
  processServerNotification(
    @Body()
    dto: AppleServerNotificationDto,
  ) {
    return this.notifications.process(dto.signedPayload);
  }
}
