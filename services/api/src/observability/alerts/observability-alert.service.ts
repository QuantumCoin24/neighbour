import { Injectable } from '@nestjs/common';

@Injectable()
export class ObservabilityAlertService {
  create(message: string, severity: 'INFO' | 'WARNING' | 'CRITICAL') {
    return {
      message,

      severity,

      createdAt: new Date(),
    };
  }
}
