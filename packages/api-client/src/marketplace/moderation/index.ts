import { apiRequest } from '../../client';

import type {
  MarketplaceModerationCase,
  MarketplaceModerationPriority,
  MarketplaceModerationStatus,
  MarketplaceModerationSubjectType,
} from './types';

export function createMarketplaceModerationCase(input: {
  subjectType: MarketplaceModerationSubjectType;
  subjectId: string;
  reason: string;
  title: string;
  description: string;
  reportedUserId?: string;
}): Promise<MarketplaceModerationCase> {
  return apiRequest<MarketplaceModerationCase>('/marketplace/moderation/cases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMarketplaceModerationQueue(): Promise<MarketplaceModerationCase[]> {
  return apiRequest<MarketplaceModerationCase[]>('/marketplace/moderation/cases');
}

export function getMarketplaceModerationCase(caseId: string): Promise<MarketplaceModerationCase> {
  return apiRequest<MarketplaceModerationCase>(
    `/marketplace/moderation/cases/${encodeURIComponent(caseId)}`,
  );
}

export function assignMarketplaceModerationCase(
  caseId: string,
  moderatorId: string,
): Promise<MarketplaceModerationCase> {
  return apiRequest<MarketplaceModerationCase>(
    `/marketplace/moderation/cases/${encodeURIComponent(caseId)}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({
        moderatorId,
      }),
    },
  );
}

export function addMarketplaceFraudSignal(
  caseId: string,
  input: {
    type: string;
    subjectId: string;
    weight: number;
    description: string;
    metadata?: Record<string, unknown>;
  },
): Promise<MarketplaceModerationCase> {
  return apiRequest<MarketplaceModerationCase>(
    `/marketplace/moderation/cases/${encodeURIComponent(caseId)}/fraud-signals`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function updateMarketplaceModerationStatus(
  caseId: string,
  status: MarketplaceModerationStatus,
  note?: string,
): Promise<MarketplaceModerationCase> {
  return apiRequest<MarketplaceModerationCase>(
    `/marketplace/moderation/cases/${encodeURIComponent(caseId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(note
          ? {
              note,
            }
          : {}),
      }),
    },
  );
}

export function getMarketplaceModerationTransitions(status: MarketplaceModerationStatus) {
  return apiRequest<{
    status: MarketplaceModerationStatus;
    allowedTransitions: MarketplaceModerationStatus[];
  }>(`/marketplace/moderation/transitions/${encodeURIComponent(status)}`);
}

export function getMarketplaceModerationRecommendedActions(
  priority: MarketplaceModerationPriority,
) {
  return apiRequest<{
    priority: MarketplaceModerationPriority;
    actions: string[];
  }>(`/marketplace/moderation/recommended-actions/${encodeURIComponent(priority)}`);
}

export * from './types';
