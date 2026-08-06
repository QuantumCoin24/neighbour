import { ConflictException, Injectable } from '@nestjs/common';

import type { MarketplaceDisputeStatus } from '../interfaces/marketplace-dispute-response.interface';

const TRANSITIONS: Record<MarketplaceDisputeStatus, MarketplaceDisputeStatus[]> = {
  OPEN: ['AWAITING_RESPONSE', 'UNDER_REVIEW', 'ESCALATED', 'CANCELLED'],
  AWAITING_RESPONSE: ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'CANCELLED'],
  UNDER_REVIEW: ['AWAITING_RESPONSE', 'ESCALATED', 'RESOLVED', 'CANCELLED'],
  ESCALATED: ['UNDER_REVIEW', 'RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class MarketplaceDisputeStateMachineService {
  canTransition(from: MarketplaceDisputeStatus, to: MarketplaceDisputeStatus): boolean {
    return TRANSITIONS[from].includes(to);
  }

  requireTransition(from: MarketplaceDisputeStatus, to: MarketplaceDisputeStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ConflictException(`Marketplace dispute cannot move from ${from} to ${to}.`);
    }
  }

  getAllowedTransitions(status: MarketplaceDisputeStatus): MarketplaceDisputeStatus[] {
    return [...TRANSITIONS[status]];
  }
}
