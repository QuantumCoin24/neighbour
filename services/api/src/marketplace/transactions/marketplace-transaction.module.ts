import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { MessageModule } from '../../message/message.module';
import { NotificationModule } from '../../notification/notification.module';

import { MarketplaceTransactionController } from './controllers/marketplace-transaction.controller';
import { MarketplaceTransactionService } from './services/marketplace-transaction.service';

@Module({
  imports: [DatabaseModule, MessageModule, NotificationModule],
  controllers: [MarketplaceTransactionController],
  providers: [MarketplaceTransactionService],
  exports: [MarketplaceTransactionService],
})
export class MarketplaceTransactionModule {}
