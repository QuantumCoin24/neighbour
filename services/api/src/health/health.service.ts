import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  service: 'neighbour-api';
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      service: 'neighbour-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.0.0-alpha.2',
    };
  }
}
