import { Injectable } from '@nestjs/common';

@Injectable()
export class SchedulerService {
  schedule(workflowId: string) {
    return {
      workflowId,
      scheduled: true,
    };
  }
}
