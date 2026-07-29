import { Injectable } from '@nestjs/common';

import type { EventEntity } from './event.entity';


@Injectable()
export class EventBusService {

  private events: EventEntity[] = [];


  publish(
    event: EventEntity,
  ): EventEntity {

    this.events.push(event);

    return event;

  }


  list(): EventEntity[] {
    return this.events;
  }

}
