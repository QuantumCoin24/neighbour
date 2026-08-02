export interface ReportResponse {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
