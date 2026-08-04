import { apiRequest } from './index';

export interface ModerationReporter {
  id: string;

  displayName: string;

  email: string;

  role: string;
}

export interface ModerationAction {
  id: string;

  action: string;

  notes: string | null;

  createdAt: string;

  moderator?: {
    id: string;
    displayName: string;
  };
}

export interface ModerationReport {
  id: string;

  targetType: string;

  targetId: string;

  reason: string;

  description: string | null;

  status: string;

  createdAt: string;

  updatedAt: string;

  reporter?: ModerationReporter;

  evidence?: any;

  actions?: ModerationAction[];
}

export function getModerationReports(
  token: string,
  filters?: {
    status?: string;
    targetType?: string;
    search?: string;
  },
) {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.targetType) {
    params.set('targetType', filters.targetType);
  }

  if (filters?.search) {
    params.set('search', filters.search);
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  return apiRequest<ModerationReport[]>(`/security/moderation/reports${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateModerationReport(
  token: string,
  id: string,
  data: {
    status: string;
    notes?: string;
  },
) {
  return apiRequest(`/security/moderation/reports/${id}`, {
    method: 'PATCH',

    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(data),
  });
}

export interface ModerationStats {
  pending: number;

  underReview: number;

  resolved: number;

  dismissed: number;
}

export function getModerationStats(token: string) {
  return apiRequest<ModerationStats>('/security/moderation/stats', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
