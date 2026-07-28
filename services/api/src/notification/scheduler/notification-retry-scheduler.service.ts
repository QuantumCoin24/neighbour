import { Injectable } from '@nestjs/common';

import { NotificationRetryQueueService } from '../queue/notification-retry-queue.service';

@Injectable()
export class NotificationRetrySchedulerService {
  constructor(private readonly queue: NotificationRetryQueueService) {}

  processReadyJobs(now: Date = new Date()): number {
    let processed = 0;

    while (true) {
      const job = this.queue.dequeue();

      if (!job) {
        break;
      }

      if (job.scheduledAt > now) {
        this.queue.enqueue({
          recipientId: job.recipientId,
          deviceId: job.deviceId,
          attempt: job.attempt,
          scheduledAt: job.scheduledAt,
          ...(job.collapseId
            ? {
                collapseId: job.collapseId,
              }
            : {}),
          payload: job.payload,
        });

        break;
      }

      processed++;
    }

    return processed;
  }
}
