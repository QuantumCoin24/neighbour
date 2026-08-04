import { Injectable } from '@nestjs/common';

export type DeveloperEvent =
  | {
      type: 'developer.app.created';
      appId: string;
    }
  | {
      type: 'api.key.generated';
      keyId: string;
    }
  | {
      type: 'scope.updated';
      appId: string;
    };

@Injectable()
export class DeveloperEventBusService {
  private listeners: ((event: DeveloperEvent) => void)[] = [];

  subscribe(listener: (event: DeveloperEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: DeveloperEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
