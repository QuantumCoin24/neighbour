import { Inject, Injectable } from '@nestjs/common';

import { DatabaseService } from './database.service';

export interface DatabaseHealthResponse {
  database: 'postgresql';
  status: 'ok';
  timestamp: string;
}

@Injectable()
export class DatabaseHealthService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async getHealth(): Promise<DatabaseHealthResponse> {
    await this.database.ping();

    return {
      database: 'postgresql',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
