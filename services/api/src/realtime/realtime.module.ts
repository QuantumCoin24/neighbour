import { Module } from '@nestjs/common';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { PresenceRegistry } from './presence/presence.registry';
import { PresenceService } from './presence/presence.service';
import { RealtimeService } from './services/realtime.service';

@Module({
  providers: [RealtimeGateway, RealtimeService, PresenceRegistry, PresenceService],
  exports: [RealtimeGateway, RealtimeService, PresenceRegistry, PresenceService],
})
export class RealtimeModule {}
