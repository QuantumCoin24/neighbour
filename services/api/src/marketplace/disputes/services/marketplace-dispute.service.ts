import { Injectable } from '@nestjs/common';

import type {
  MarketplaceDisputeHealthResponse,
  MarketplaceDisputeStatus,
} from '../interfaces/marketplace-dispute-response.interface';
import { MarketplaceDisputeStateMachineService } from '../state-machine/marketplace-dispute-state-machine.service';

@Injectable()
export class MarketplaceDisputeService {
  constructor(private readonly stateMachine: MarketplaceDisputeStateMachineService) {}

  getHealth(): MarketplaceDisputeHealthResponse {
    return {
      service: 'Marketplace DisputeOS',
      status: 'READY',
      architecture: 'AUDIT_DRIVEN',
      evidenceEnabled: true,
      mediationEnabled: true,
    };
  }

  getRules() {
    return {
      completedOrActiveTransactionRequired: true,
      participantOnlyCreation: true,
      duplicateOpenDisputesPrevented: true,
      evidenceVaultEnabled: true,
      immutableEventTimeline: true,
      responseWindowHours: 72,
      automaticEscalationEnabled: true,
      paymentIntegrationEnabled: true,
      reputationIntegrationEnabled: true,
      moderationRequiredForFinalResolution: true,
    };
  }

  getAllowedTransitions(status: MarketplaceDisputeStatus) {
    return {
      status,
      allowedTransitions: this.stateMachine.getAllowedTransitions(status),
    };
  }
}
