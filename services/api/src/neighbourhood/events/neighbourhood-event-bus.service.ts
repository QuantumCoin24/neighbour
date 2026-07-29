import { Injectable } from '@nestjs/common';

export type NeighbourhoodEvent =
  | {
      type: 'neighbourhood.created';
      neighbourhoodId: string;
    }
  | {
      type: 'member.joined';
      userId: string;
      neighbourhoodId: string;
    }
  | {
      type: 'member.left';
      userId: string;
      neighbourhoodId: string;
    };

export type NeighbourhoodEventHandler = (event: NeighbourhoodEvent) => void;

@Injectable()
export class NeighbourhoodEventBusService {
  private handlers: NeighbourhoodEventHandler[] = [];

  subscribe(handler: NeighbourhoodEventHandler): () => void {
    this.handlers.push(handler);

    return () => {
      this.handlers = this.handlers.filter((item) => item !== handler);
    };
  }

  publish(event: NeighbourhoodEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
