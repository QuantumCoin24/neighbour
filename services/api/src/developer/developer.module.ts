import { Module } from '@nestjs/common';

import { DeveloperPlatformService } from './developer-platform.service';

import { DeveloperAppService } from './apps/developer-app.service';
import { ApiKeyService } from './keys/api-key.service';
import { ScopeService } from './scopes/scope.service';
import { DeveloperEventBusService } from './events/developer-event-bus.service';

@Module({
  providers: [
    DeveloperPlatformService,

    DeveloperAppService,

    ApiKeyService,

    ScopeService,

    DeveloperEventBusService,
  ],

  exports: [DeveloperPlatformService],
})
export class DeveloperModule {}
