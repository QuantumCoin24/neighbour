import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { NotificationRetryJob } from './notification-retry-job.interface';

@Injectable()
export class NotificationRetryQueueService {
  private readonly jobs = new Map<string, NotificationRetryJob>();

  enqueue(job: Omit<NotificationRetryJob, 'id'>): NotificationRetryJob {
    const created: NotificationRetryJob = {
      id: randomUUID(),
      ...job,
    };

    this.jobs.set(created.id, created);

    return created;
  }

  dequeue(): NotificationRetryJob | null {
    const first = this.jobs.values().next();

    if (first.done) {
      return null;
    }

    this.jobs.delete(first.value.id);

    return first.value;
  }

  size(): number {
    return this.jobs.size;
  }

  clear(): void {
    this.jobs.clear();
  }

  all(): NotificationRetryJob[] {
    return [...this.jobs.values()];
  }
}
