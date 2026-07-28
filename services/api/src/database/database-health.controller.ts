import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

import type { DatabaseHealthResponse } from './database-health.service';
import { DatabaseHealthService } from './database-health.service';

@Public()
@Controller('health/database')
export class DatabaseHealthController {
  constructor(
    @Inject(DatabaseHealthService)
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  @Get()
  getHealth(): Promise<DatabaseHealthResponse> {
    return this.databaseHealthService.getHealth();
  }
}
