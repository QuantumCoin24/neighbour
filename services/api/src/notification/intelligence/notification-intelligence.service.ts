import { Injectable } from '@nestjs/common';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

@Injectable()
export class NotificationIntelligenceService {
  evaluate(input: { type: string }): {
    priority: NotificationPriority;

    shouldNotify: boolean;
  } {
    switch (input.type) {
      case 'SECURITY':
      case 'MESSAGE':
      case 'MENTION':
        return {
          priority: 'HIGH',

          shouldNotify: true,
        };

      case 'COMMUNITY_UPDATE':
      case 'EVENT_UPDATE':
        return {
          priority: 'NORMAL',

          shouldNotify: true,
        };

      default:
        return {
          priority: 'LOW',

          shouldNotify: true,
        };
    }
  }
}
