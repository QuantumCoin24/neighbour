import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MessageController } from './message.controller';
import { MessageRealtimePublisher } from './events/message-realtime.publisher';
import { MessageService } from './message.service';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRealtimePublisher],
  exports: [MessageService],
})
export class MessageModule {}
