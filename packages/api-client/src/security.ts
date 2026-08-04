import { apiRequest } from './index';

export interface SecurityReport {
  id: string;

  reporterId: string;

  targetType: string;

  targetId: string;

  reason: string;

  description: string | null;

  status: string;

  createdAt: string;

  updatedAt: string;
}

export interface CreateSecurityReportInput {
  targetType: string;

  targetId: string;

  reason: string;

  description?: string;
}

export function createSecurityReport(
  token: string,

  data: CreateSecurityReportInput,
) {
  return apiRequest<SecurityReport>(
    '/security/reports',

    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(data),
    },
  );
}

export function getMySecurityReports(token: string) {
  return apiRequest<SecurityReport[]>(
    '/security/reports/mine',

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
