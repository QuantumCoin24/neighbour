import { Injectable } from '@nestjs/common';

@Injectable()
export class EventRouterService {
  route(type: string) {
    return {
      eventType: type,
      routed: true,
    };
  }
}
