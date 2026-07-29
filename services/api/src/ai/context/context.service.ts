import { Injectable } from '@nestjs/common';

import type { AIContextEntity } from './ai-context.entity';

@Injectable()
export class ContextService {
  private contexts: AIContextEntity[] = [];

  add(context: AIContextEntity): AIContextEntity {
    this.contexts.push(context);

    return context;
  }

  findForUser(userId: string): AIContextEntity[] {
    return this.contexts.filter((item) => item.userId === userId);
  }
}
