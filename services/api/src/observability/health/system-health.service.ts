import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemHealthService {
  check() {
    return {
      status: 'HEALTHY',

      services: {
        api: true,

        database: true,

        events: true,
      },

      checkedAt: new Date(),
    };
  }
}
