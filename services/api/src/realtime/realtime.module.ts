import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WebSocketAuthService } from './auth/websocket-auth.service';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { PresenceRegistry } from './presence/presence.registry';
import { PresenceService } from './presence/presence.service';
import { RealtimeService } from './services/realtime.service';

@Module({
  imports: [AuthModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
  ],
  exports: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
  ],
})
export class RealtimeModule {}
