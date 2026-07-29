export interface ExecutionEntity {
  id: string;
  workflowId: string;
  status: 'started' | 'completed' | 'failed';
  createdAt: Date;
}
