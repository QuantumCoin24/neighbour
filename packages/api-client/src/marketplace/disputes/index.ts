import { apiRequest } from '../../client';

import type { MarketplaceDisputeHealth, MarketplaceDisputeStatus } from './types';

export function getMarketplaceDisputeHealth(): Promise<MarketplaceDisputeHealth> {
  return apiRequest<MarketplaceDisputeHealth>('/marketplace/disputes/health');
}

export function getMarketplaceDisputeRules() {
  return apiRequest<{
    completedOrActiveTransactionRequired: boolean;
    participantOnlyCreation: boolean;
    duplicateOpenDisputesPrevented: boolean;
    evidenceVaultEnabled: boolean;
    immutableEventTimeline: boolean;
    responseWindowHours: number;
    automaticEscalationEnabled: boolean;
    paymentIntegrationEnabled: boolean;
    reputationIntegrationEnabled: boolean;
    moderationRequiredForFinalResolution: boolean;
  }>('/marketplace/disputes/rules');
}

export function getMarketplaceDisputeTransitions(status: MarketplaceDisputeStatus) {
  return apiRequest<{
    status: MarketplaceDisputeStatus;
    allowedTransitions: MarketplaceDisputeStatus[];
  }>(`/marketplace/disputes/transitions/${encodeURIComponent(status)}`);
}

export * from './types';
