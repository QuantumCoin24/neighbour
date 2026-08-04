import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivationPriorityService {
  evaluate(priority: string) {
    return {
      priority,

      requiresAttention: priority === 'HIGH',

      evaluatedAt: new Date(),
    };
  }
}
