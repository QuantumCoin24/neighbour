import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { FulfilmentController } from './controllers/fulfilment.controller';
import { FulfilmentService } from './services/fulfilment.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FulfilmentController],
  providers: [FulfilmentService],
  exports: [FulfilmentService],
})
export class FulfilmentModule {}
