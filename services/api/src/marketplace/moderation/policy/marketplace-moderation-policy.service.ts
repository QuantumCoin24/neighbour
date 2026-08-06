import {
  Injectable,
} from '@nestjs/common';

import type {
  MarketplaceModerationActionType,
  MarketplaceModerationPriority,
} from '../../../generated/prisma/client';

@Injectable()
export class MarketplaceModerationPolicyService {
  getRecommendedActions(
    priority: MarketplaceModerationPriority,
  ): MarketplaceModerationActionType[] {
    switch (priority) {
      case 'CRITICAL':
        return [
          'ACCOUNT_SUSPENDED',
          'PAYMENT_HOLD',
          'IDENTITY_REVERIFICATION',
        ];

      case 'URGENT':
        return [
          'MARKETPLACE_RESTRICTED',
          'PAYMENT_HOLD',
          'IDENTITY_REVERIFICATION',
        ];

      case 'HIGH':
        return [
          'WARNING',
          'CONTENT_HIDDEN',
          'MARKETPLACE_RESTRICTED',
        ];

      case 'NORMAL':
        return [
          'WARNING',
          'CONTENT_HIDDEN',
        ];

      case 'LOW':
      default:
        return [
          'NO_ACTION',
          'WARNING',
        ];
    }
  }

  requiresSecondReviewer(
    action: MarketplaceModerationActionType,
  ): boolean {
    return [
      'ACCOUNT_TERMINATED',
      'ACCOUNT_SUSPENDED',
      'REFUND_REQUIRED',
      'PAYMENT_HOLD',
    ].includes(action);
  }

  isAppealable(
    action: MarketplaceModerationActionType,
  ): boolean {
    return action !== 'NO_ACTION';
  }
}
