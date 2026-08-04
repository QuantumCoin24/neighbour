import { Injectable } from '@nestjs/common';

import type { ApiScopeEntity } from './api-scope.entity';

@Injectable()
export class ScopeService {
  private scopes: ApiScopeEntity[] = [];

  grant(scope: ApiScopeEntity): ApiScopeEntity {
    this.scopes.push(scope);

    return scope;
  }

  findByApp(appId: string): ApiScopeEntity[] {
    return this.scopes.filter((item) => item.appId === appId);
  }
}
