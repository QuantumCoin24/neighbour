import { Module } from '@nestjs/common';

import { SubscriptionModule } from '../subscription/subscription.module';
import { AppleCommerceController } from './controllers/apple-commerce.controller';
import { AppleCommerceService } from './services/apple-commerce.service';
import { AppleProductService } from './services/apple-product.service';
import { AppleTransactionDecoderService } from './services/apple-transaction-decoder.service';

import { AppleServerNotificationDecoderService } from './notifications/apple-server-notification-decoder.service';
import { AppleServerNotificationService } from './notifications/apple-server-notification.service';

@Module({
  imports: [SubscriptionModule],
  controllers: [AppleCommerceController],
  providers: [
    AppleServerNotificationService,
    AppleServerNotificationDecoderService,
    AppleProductService,
    AppleTransactionDecoderService,
    AppleCommerceService,
  ],
  exports: [AppleProductService, AppleTransactionDecoderService, AppleCommerceService],
})
export class AppleCommerceModule {}
