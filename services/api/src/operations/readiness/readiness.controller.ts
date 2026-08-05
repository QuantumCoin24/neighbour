import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { ReadinessService } from './readiness.service';

@Controller()
export class ReadinessController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Public()
  @Get('live')
  getLiveness() {
    return {
      status: 'ALIVE',
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  async getReadiness() {
    const result = await this.readinessService.check();

    if (result.status !== 'READY') {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }
}
