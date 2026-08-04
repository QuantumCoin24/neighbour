import { Injectable } from '@nestjs/common';

@Injectable()
export class JourneyMapService {
  map() {
    return [
      {
        name: 'AUTH',
        status: 'READY',
      },

      {
        name: 'PROFILE',
        status: 'READY',
      },

      {
        name: 'COMMUNITY',
        status: 'READY',
      },

      {
        name: 'MESSAGING',
        status: 'READY',
      },

      {
        name: 'NOTIFICATIONS',
        status: 'READY',
      },
    ];
  }
}
