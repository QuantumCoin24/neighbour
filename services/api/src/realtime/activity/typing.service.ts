import { Injectable } from '@nestjs/common';

import type { TypingState } from '../interfaces/typing-state.interface';

@Injectable()
export class TypingService {
  private readonly timeoutMilliseconds = 5_000;

  private readonly activeTyping = new Map<
    string,
    {
      state: TypingState;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();

  start(
    conversationId: string,
    userId: string,
    socketId: string,
    onTimeout: (state: TypingState) => void,
  ): TypingState {
    const key = this.createKey(conversationId, socketId);
    const existing = this.activeTyping.get(key);

    if (existing) {
      clearTimeout(existing.timeout);
    }

    const state: TypingState = {
      conversationId,
      userId,
      socketId,
      typing: true,
      changedAt: new Date().toISOString(),
    };

    const timeout = setTimeout(() => {
      const stoppedState = this.stop(conversationId, socketId);

      if (stoppedState) {
        onTimeout(stoppedState);
      }
    }, this.timeoutMilliseconds);

    this.activeTyping.set(key, {
      state,
      timeout,
    });

    return state;
  }

  stop(conversationId: string, socketId: string): TypingState | null {
    const key = this.createKey(conversationId, socketId);
    const existing = this.activeTyping.get(key);

    if (!existing) {
      return null;
    }

    clearTimeout(existing.timeout);
    this.activeTyping.delete(key);

    return {
      ...existing.state,
      typing: false,
      changedAt: new Date().toISOString(),
    };
  }

  stopAllForSocket(socketId: string): TypingState[] {
    const stoppedStates: TypingState[] = [];

    for (const [key, entry] of this.activeTyping.entries()) {
      if (entry.state.socketId !== socketId) {
        continue;
      }

      clearTimeout(entry.timeout);
      this.activeTyping.delete(key);

      stoppedStates.push({
        ...entry.state,
        typing: false,
        changedAt: new Date().toISOString(),
      });
    }

    return stoppedStates;
  }

  private createKey(conversationId: string, socketId: string): string {
    return `${conversationId}:${socketId}`;
  }
}
