import { Injectable } from '@nestjs/common';

export type MediaEvent =
  | {
      type: 'media.uploaded';
      assetId: string;
    }
  | {
      type: 'media.processed';
      assetId: string;
    }
  | {
      type: 'media.deleted';
      assetId: string;
    };

@Injectable()
export class MediaEventBusService {
  private listeners: ((event: MediaEvent) => void)[] = [];

  subscribe(listener: (event: MediaEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: MediaEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
