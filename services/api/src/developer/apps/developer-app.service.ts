import { Injectable } from '@nestjs/common';

import type { DeveloperAppEntity } from './developer-app.entity';

@Injectable()
export class DeveloperAppService {
  private apps: DeveloperAppEntity[] = [];

  create(app: DeveloperAppEntity): DeveloperAppEntity {
    this.apps.push(app);

    return app;
  }

  findByOwner(ownerId: string): DeveloperAppEntity[] {
    return this.apps.filter((item) => item.ownerId === ownerId);
  }
}
