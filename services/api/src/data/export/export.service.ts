import { Injectable } from '@nestjs/common';

import type { ExportJobEntity } from './export-job.entity';

@Injectable()
export class ExportService {
  private jobs: ExportJobEntity[] = [];

  request(job: ExportJobEntity): ExportJobEntity {
    this.jobs.push(job);

    return job;
  }

  complete(id: string): ExportJobEntity | undefined {
    const job = this.jobs.find((item) => item.id === id);

    if (!job) {
      return undefined;
    }

    job.status = 'completed';

    return job;
  }
}
