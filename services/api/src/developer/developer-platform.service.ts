import { Injectable } from '@nestjs/common';

import { DeveloperAppService } from './apps/developer-app.service';
import { ApiKeyService } from './keys/api-key.service';
import { ScopeService } from './scopes/scope.service';
import { DeveloperEventBusService } from './events/developer-event-bus.service';

import type { DeveloperAppEntity } from './apps/developer-app.entity';
import type { ApiKeyEntity } from './keys/api-key.entity';
import type { ApiScopeEntity } from './scopes/api-scope.entity';

@Injectable()
export class DeveloperPlatformService {
  constructor(
    private readonly apps: DeveloperAppService,

    private readonly keys: ApiKeyService,

    private readonly scopes: ScopeService,

    private readonly events: DeveloperEventBusService,
  ) {}

  createApp(app: DeveloperAppEntity) {
    const created = this.apps.create(app);

    this.events.publish({
      type: 'developer.app.created',

      appId: created.id,
    });

    return created;
  }

  generateKey(key: ApiKeyEntity) {
    const created = this.keys.create(key);

    this.events.publish({
      type: 'api.key.generated',

      keyId: created.id,
    });

    return created;
  }

  grantScope(scope: ApiScopeEntity) {
    const created = this.scopes.grant(scope);

    this.events.publish({
      type: 'scope.updated',

      appId: created.appId,
    });

    return created;
  }
}
