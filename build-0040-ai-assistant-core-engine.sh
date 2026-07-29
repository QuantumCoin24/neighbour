#!/bin/bash

set -e

echo "🚀 BUILD 0040 — AI Assistant Core Engine"

cd services/api

mkdir -p src/ai/assistant
mkdir -p src/ai/context
mkdir -p src/ai/actions
mkdir -p src/ai/events


# =====================================
# ASSISTANT CORE
# =====================================

cat > src/ai/assistant/assistant.entity.ts <<'TS'
export interface AssistantEntity {
  id: string;
  userId: string;
  prompt: string;
  response: string;
  createdAt: Date;
}
TS


cat > src/ai/assistant/assistant.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { AssistantEntity } from './assistant.entity';


@Injectable()
export class AssistantService {

  private conversations:
    AssistantEntity[] = [];


  ask(
    conversation: AssistantEntity,
  ): AssistantEntity {

    this.conversations.push(
      conversation,
    );

    return conversation;
  }


  history(
    userId: string,
  ): AssistantEntity[] {

    return this.conversations.filter(
      (item) =>
        item.userId === userId,
    );
  }

}
TS


# =====================================
# AI CONTEXT
# =====================================

cat > src/ai/context/ai-context.entity.ts <<'TS'
export interface AIContextEntity {
  id: string;
  userId: string;
  category: string;
  value: string;
  createdAt: Date;
}
TS


cat > src/ai/context/context.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { AIContextEntity } from './ai-context.entity';


@Injectable()
export class ContextService {

  private contexts:
    AIContextEntity[] = [];


  add(
    context: AIContextEntity,
  ): AIContextEntity {

    this.contexts.push(context);

    return context;
  }


  findForUser(
    userId: string,
  ): AIContextEntity[] {

    return this.contexts.filter(
      (item) =>
        item.userId === userId,
    );
  }

}
TS


# =====================================
# AI ACTIONS
# =====================================

cat > src/ai/actions/ai-action.entity.ts <<'TS'
export interface AIActionEntity {
  id: string;
  userId: string;
  action:
    | 'create_event'
    | 'find_service'
    | 'join_community'
    | 'update_profile';
  status:
    | 'suggested'
    | 'completed';
  createdAt: Date;
}
TS


cat > src/ai/actions/action.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { AIActionEntity } from './ai-action.entity';


@Injectable()
export class ActionService {

  private actions:
    AIActionEntity[] = [];


  suggest(
    action: AIActionEntity,
  ): AIActionEntity {

    this.actions.push(action);

    return action;
  }


  complete(
    id: string,
  ): AIActionEntity | undefined {

    const action =
      this.actions.find(
        (item) =>
          item.id === id,
      );

    if (!action) {
      return undefined;
    }

    action.status = 'completed';

    return action;
  }

}
TS


# =====================================
# AI EVENTS
# =====================================

cat > src/ai/events/ai-event-bus.service.ts <<'TS'
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

  private listeners:
    ((event: AIEvent) => void)[] = [];


  subscribe(
    listener: (event: AIEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: AIEvent,
  ) {

    for (const listener of this.listeners) {
      listener(event);
    }

  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/ai

cat > test/ai/assistant.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AssistantService } from '../../src/ai/assistant/assistant.service';


describe('AssistantService', () => {

  it('stores assistant conversations', () => {

    const service =
      new AssistantService();


    const result =
      service.ask({
        id: 'assistant-1',
        userId: 'user-1',
        prompt: 'Find my local community',
        response: 'Community found',
        createdAt: new Date(),
      });


    assert.equal(
      result.userId,
      'user-1',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0040 COMPLETE"

