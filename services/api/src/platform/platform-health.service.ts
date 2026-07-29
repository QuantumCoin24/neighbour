import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformHealthService {
  status() {
    return {
      status: 'healthy',
      timestamp: new Date(),
    };
  }
}
