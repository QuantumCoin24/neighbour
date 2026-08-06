import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import type {
  MarketplaceModerationStatus,
} from '../../../generated/prisma/client';

const TRANSITIONS: Record<
  MarketplaceModerationStatus,
  MarketplaceModerationStatus[]
> = {
  OPEN: [
    'TRIAGED',
    'UNDER_REVIEW',
    'DISMISSED',
  ],
  TRIAGED: [
    'UNDER_REVIEW',
    'AWAITING_INFORMATION',
    'ACTION_REQUIRED',
    'DISMISSED',
  ],
  UNDER_REVIEW: [
    'AWAITING_INFORMATION',
    'ACTION_REQUIRED',
    'RESOLVED',
    'DISMISSED',
  ],
  AWAITING_INFORMATION: [
    'UNDER_REVIEW',
    'ACTION_REQUIRED',
    'DISMISSED',
  ],
  ACTION_REQUIRED: [
    'RESOLVED',
    'DISMISSED',
  ],
  RESOLVED: [
    'APPEALED',
    'CLOSED',
  ],
  DISMISSED: [
    'CLOSED',
  ],
  APPEALED: [
    'UNDER_REVIEW',
    'RESOLVED',
    'CLOSED',
  ],
  CLOSED: [],
};

@Injectable()
export class MarketplaceModerationStateMachineService {
  canTransition(
    from: MarketplaceModerationStatus,
    to: MarketplaceModerationStatus,
  ): boolean {
    return (
      TRANSITIONS[from] ?? []
    ).includes(to);
  }

  requireTransition(
    from: MarketplaceModerationStatus,
    to: MarketplaceModerationStatus,
  ): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Invalid moderation transition: ${from} → ${to}`,
      );
    }
  }

  getAllowedTransitions(
    status: MarketplaceModerationStatus,
  ): MarketplaceModerationStatus[] {
    return [
      ...(TRANSITIONS[status] ?? []),
    ];
  }
}
