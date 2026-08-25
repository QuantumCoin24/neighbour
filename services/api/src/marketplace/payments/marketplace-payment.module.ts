import { Module } from '@nestjs/common';

import { SubscriptionModule } from '../../payments/subscription/subscription.module';
import { MarketplacePaymentController } from './controllers/marketplace-payment.controller';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { MarketplacePaymentService } from './services/marketplace-payment.service';

@Module({
  imports: [SubscriptionModule],
  controllers: [MarketplacePaymentController],
  providers: [ManualPaymentProvider, StripePaymentProvider, MarketplacePaymentService],
  exports: [MarketplacePaymentService],
})
export class MarketplacePaymentModule {}
