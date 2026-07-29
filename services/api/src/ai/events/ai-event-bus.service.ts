import { Injectable } from '@nestjs/common';

export type AIEvent =
  | {
      type: 'assistant.requested';
      userId: string;
    }
  | {
      type: 'assistant.responded';
      userId: string;
    }
  | {
      type: 'action.completed';
      actionId: string;
    };

@Injectable()
export class AIEventBusService {
  private listeners: ((event: AIEvent) => void)[] = [];

  subscribe(listener: (event: AIEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: AIEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
