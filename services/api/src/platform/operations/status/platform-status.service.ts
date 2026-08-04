import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformStatusService {
  status() {
    return {
      online: true,
      healthScore: 100,
    };
  }
}
