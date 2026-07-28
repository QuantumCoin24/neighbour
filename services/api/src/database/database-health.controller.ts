import { Controller, Get, Inject } from '@nestjs/common';

import type { DatabaseHealthResponse } from './database-health.service';
import { DatabaseHealthService } from './database-health.service';

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
