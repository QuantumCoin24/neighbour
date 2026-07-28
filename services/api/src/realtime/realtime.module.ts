import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { TypingService } from './activity/typing.service';
import { WebSocketAuthService } from './auth/websocket-auth.service';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { PresenceRegistry } from './presence/presence.registry';
import { PresenceService } from './presence/presence.service';
import { ConversationRoomService } from './rooms/conversation-room.service';
import { RealtimeService } from './services/realtime.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
    ConversationRoomService,
    TypingService,
  ],
  exports: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
    ConversationRoomService,
    TypingService,
  ],
})
export class RealtimeModule {}
