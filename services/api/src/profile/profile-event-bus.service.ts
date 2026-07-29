import { Injectable } from '@nestjs/common';

export interface ProfileCreatedEvent {
  type: 'profile.created';
  profileId: string;
  userId: string;
  username: string;
}

export interface ProfileUpdatedEvent {
  type: 'profile.updated';
  profileId: string;
  userId: string;
}

export type ProfileEvent =
  | ProfileCreatedEvent
  | ProfileUpdatedEvent;

export type ProfileEventHandler =
  (event: ProfileEvent) => void;

@Injectable()
export class ProfileEventBusService {
  private handlers: ProfileEventHandler[] = [];

  subscribe(
    handler: ProfileEventHandler,
  ): () => void {
    this.handlers.push(handler);

    return () => {
      this.handlers =
        this.handlers.filter(
          (item) => item !== handler,
        );
    };
  }

  publish(
    event: ProfileEvent,
  ): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
