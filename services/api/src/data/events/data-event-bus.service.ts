import { Injectable } from '@nestjs/common';

export type DataEvent =
  | {
      type: 'export.requested';
      exportId: string;
    }
  | {
      type: 'export.completed';
      exportId: string;
    }
  | {
      type: 'backup.created';
      backupId: string;
    };

@Injectable()
export class DataEventBusService {
  private listeners: ((event: DataEvent) => void)[] = [];

  subscribe(listener: (event: DataEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: DataEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
