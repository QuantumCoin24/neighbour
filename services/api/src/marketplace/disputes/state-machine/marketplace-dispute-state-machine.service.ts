import { Injectable, BadRequestException } from '@nestjs/common';

import { MarketplaceDisputeStatus } from '../../../generated/prisma/client';

const TRANSITIONS: Record<MarketplaceDisputeStatus, MarketplaceDisputeStatus[]> = {
  OPEN: [
    MarketplaceDisputeStatus.AWAITING_RESPONSE,
    MarketplaceDisputeStatus.ESCALATED,
    MarketplaceDisputeStatus.CANCELLED,
  ],
  AWAITING_RESPONSE: [
    MarketplaceDisputeStatus.UNDER_REVIEW,
    MarketplaceDisputeStatus.ESCALATED,
    MarketplaceDisputeStatus.CANCELLED,
  ],
  UNDER_REVIEW: [
    MarketplaceDisputeStatus.ESCALATED,
    MarketplaceDisputeStatus.RESOLVED,
    MarketplaceDisputeStatus.CANCELLED,
  ],
  ESCALATED: [MarketplaceDisputeStatus.RESOLVED, MarketplaceDisputeStatus.CANCELLED],
  RESOLVED: [MarketplaceDisputeStatus.CLOSED],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class MarketplaceDisputeStateMachineService {
  canTransition(from: MarketplaceDisputeStatus, to: MarketplaceDisputeStatus): boolean {
    return (TRANSITIONS[from] ?? []).includes(to);
  }

  requireTransition(from: MarketplaceDisputeStatus, to: MarketplaceDisputeStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(`Invalid dispute transition: ${from} → ${to}`);
    }
  }

  getAllowedTransitions(status: MarketplaceDisputeStatus): MarketplaceDisputeStatus[] {
    return [...(TRANSITIONS[status] ?? [])];
  }
}
