import { Injectable } from '@nestjs/common';


@Injectable()
export class EventHistoryService {

  record(
    eventId: string,
  ) {

    return {
      eventId,
      recordedAt: new Date(),
    };

  }

}
