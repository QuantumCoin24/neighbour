import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

import { HealthService } from './health.service';
import type { HealthResponse } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthService)
    private readonly healthService: HealthService,
  ) {}

  @Get()
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
