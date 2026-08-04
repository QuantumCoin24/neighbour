import { Injectable } from '@nestjs/common';

@Injectable()
export class EventMonitoringService {
  check(events: string) {
    return {
      events,

      visible: events === 'READY',

      checkedAt: new Date(),
    };
  }
}
