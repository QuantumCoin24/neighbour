import { Injectable } from '@nestjs/common';

export type CommunityFeedEvent =
  | {
      type: 'post.created';
      postId: string;
    }
  | {
      type: 'post.reacted';
      postId: string;
    };

@Injectable()
export class CommunityFeedEventBusService {
  private listeners: ((event: CommunityFeedEvent) => void)[] = [];

  subscribe(listener: (event: CommunityFeedEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: CommunityFeedEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
