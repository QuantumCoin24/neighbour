import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthMonitorService {

  check(
    service: string,
  ) {

    return {
      service,
      status: 'active',
    };

  }

}
