import { Injectable } from '@nestjs/common';

import type { AssistantEntity } from './assistant.entity';

@Injectable()
export class AssistantService {
  private conversations: AssistantEntity[] = [];

  ask(conversation: AssistantEntity): AssistantEntity {
    this.conversations.push(conversation);

    return conversation;
  }

  history(userId: string): AssistantEntity[] {
    return this.conversations.filter((item) => item.userId === userId);
  }
}
