import { Injectable } from '@nestjs/common';

import type { AIActionEntity } from './ai-action.entity';

@Injectable()
export class ActionService {
  private actions: AIActionEntity[] = [];

  suggest(action: AIActionEntity): AIActionEntity {
    this.actions.push(action);

    return action;
  }

  complete(id: string): AIActionEntity | undefined {
    const action = this.actions.find((item) => item.id === id);

    if (!action) {
      return undefined;
    }

    action.status = 'completed';

    return action;
  }
}
