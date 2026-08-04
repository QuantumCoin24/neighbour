import { Injectable } from '@nestjs/common';

@Injectable()
export class AlertMonitoringService {
  check(alerts: string) {
    return {
      alerts,

      visible: alerts === 'READY',

      checkedAt: new Date(),
    };
  }
}
