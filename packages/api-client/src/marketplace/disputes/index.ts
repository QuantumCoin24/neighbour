import { apiRequest } from '../../client';

import type {
  MarketplaceDispute,
  MarketplaceDisputeEvidenceType,
  MarketplaceDisputeReason,
  MarketplaceDisputeStatus,
} from './types';

export function createMarketplaceDispute(input: {
  transactionId: string;
  reason: MarketplaceDisputeReason;
  title: string;
  description: string;
  requestedResolution?: string;
}): Promise<MarketplaceDispute> {
  return apiRequest<MarketplaceDispute>('/marketplace/disputes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMyMarketplaceDisputes(): Promise<MarketplaceDispute[]> {
  return apiRequest<MarketplaceDispute[]>('/marketplace/disputes/mine');
}

export function getMarketplaceDispute(disputeId: string): Promise<MarketplaceDispute> {
  return apiRequest<MarketplaceDispute>(`/marketplace/disputes/${encodeURIComponent(disputeId)}`);
}

export function addMarketplaceDisputeMessage(
  disputeId: string,
  message: string,
): Promise<MarketplaceDispute> {
  return apiRequest<MarketplaceDispute>(
    `/marketplace/disputes/${encodeURIComponent(disputeId)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
      }),
    },
  );
}

export function respondToMarketplaceDispute(
  disputeId: string,
  input: {
    response: string;
    proposedResolution?: string;
  },
): Promise<MarketplaceDispute> {
  return apiRequest<MarketplaceDispute>(
    `/marketplace/disputes/${encodeURIComponent(disputeId)}/respond`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function addMarketplaceDisputeEvidence(
  disputeId: string,
  input: {
    mediaId: string;
    type: MarketplaceDisputeEvidenceType;
    description?: string;
  },
): Promise<MarketplaceDispute> {
  return apiRequest<MarketplaceDispute>(
    `/marketplace/disputes/${encodeURIComponent(disputeId)}/evidence`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function escalateMarketplaceDispute(
  disputeId: string,
  input: {
    reason: string;
    additionalContext?: string;
  },
): Promise<MarketplaceDispute> {
  return apiRequest<MarketplaceDispute>(
    `/marketplace/disputes/${encodeURIComponent(disputeId)}/escalate`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function cancelMarketplaceDispute(
  disputeId: string,
  note?: string,
): Promise<MarketplaceDispute> {
  return apiRequest<MarketplaceDispute>(
    `/marketplace/disputes/${encodeURIComponent(disputeId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...(note
          ? {
              note,
            }
          : {}),
      }),
    },
  );
}

export function getMarketplaceDisputeTransitions(status: MarketplaceDisputeStatus) {
  return apiRequest<{
    status: MarketplaceDisputeStatus;
    allowedTransitions: MarketplaceDisputeStatus[];
  }>(`/marketplace/disputes/transitions/${encodeURIComponent(status)}`);
}

export * from './types';
