export interface ExportJobEntity {
  id: string;
  userId: string;
  status: 'requested' | 'processing' | 'completed';
  createdAt: Date;
}
