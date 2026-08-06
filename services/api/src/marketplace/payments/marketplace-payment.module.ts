import { Module } from '@nestjs/common';

import { MarketplacePaymentController } from './controllers/marketplace-payment.controller';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { MarketplacePaymentService } from './services/marketplace-payment.service';

@Module({
  controllers: [MarketplacePaymentController],
  providers: [ManualPaymentProvider, MarketplacePaymentService],
  exports: [MarketplacePaymentService],
})
export class MarketplacePaymentModule {}
