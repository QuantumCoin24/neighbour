import { apiRequest } from './client';

export type ReportTargetType =
  | 'USER'
  | 'POST'
  | 'COMMENT'
  | 'MESSAGE'
  | 'EVENT'
  | 'MARKETPLACE_LISTING'
  | 'MAP_DISCOVERY';

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
}

export interface SecurityReport {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  updatedAt: string;
}

export function createSecurityReport(input: CreateReportInput): Promise<SecurityReport> {
  return apiRequest<SecurityReport>('/security/reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMySecurityReports(): Promise<SecurityReport[]> {
  return apiRequest<SecurityReport[]>('/security/reports/mine');
}
