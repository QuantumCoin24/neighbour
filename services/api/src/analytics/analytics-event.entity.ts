export interface AnalyticsEventEntity {
  id: string;
  type: string;
  subjectId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
